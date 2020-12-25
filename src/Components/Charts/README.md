# On this D3 chart implementation

**Working assumptions:**

React is a great tool to manage a web interface, it is also blazing fast. However, in a way, its very nature gets in the way. The fact that it needs to go through a rendering step in which it resolves the state of the page (and which it may be delayed for various reasons) makes it hard to update complex charts smoothly without additional tooling.

> When you have a chart with thousands of data-points, you have to just update it. Fast.

D3 likes to directly manipulate the DOM to provide fast charts and animations, but in doing so it has a strong tendency to bloat and very often ends up becoming a huge interconnected mess of functions and objects.

> Mixing different DOM-altering libraries is often not a good idea as they might get in each other's way, but, by clearly delimiting D3's role inside hooks, much of the complexity and ambiguity vanishes.

**What I wanted:**

Unsurprisingly, I wanted the performance of D3 and the modularity of React. I wanted to plot every data-point without sampling and do it for as many lanes as necessary.

**What I thought about:**

The first option I considered was using a library, the chart I needed is very common after all. However, after trying several I found that they were simply not fast enough to efficiently render thousands of datapoints, and I did not wish to sample if possible (which it is).

When I finally started looking at D3, one approach I found online was to build react components for each part of a chart (`<Axis/>`). This method, while 100% compatible with React, hamstrung D3.

> This is because **D3 wants to touch everything**, it wants the brush to change the axis, the axis to be used to update the area chart, and the zoom to manipulate all of them. It's fast also because, when you zoom, your callback directly goes to the axis and tells it to move.

Additionally, React components are designed as one-way streets, with data going downstream, and are mostly dependent on state changes to receive new information, so they work best with relatively small or static charts.

> I can't easily go through React to update a 3000 points chart at 60-fps (not yet anyway). This is not because it's slow, but because I can't control whether, for example, it is waiting for something somewhere else to resolve before committing the render. 
> 
> The experimental concurrent mode might change this.

There was also obviously the option to go the full D3 monolith route, but that's just bad code as D3 is (notoriously) hard to debug and reason about. This might have worked for a one-off chart, but it wouldn't have been quality code.

The final option which I decided to go with is to build my one-chart library with hooks.

**Why I decided to go with hooks:**
- Hooks are great.
- Hooks allow you to take advantage of important React features, like *Refs*.
- Hooks are a two-way street, so a 'component' can both return important values and define an interface to access the underlying elements.
- Hooks can return refs which may be applied to a user-determined element, allowing the hook to hide the logic applied while maintaining a high degree of flexibility.

**How is the mini library structured:**

There are 4 base hooks: *useAxis*, *useAreaStack*, *useBrush*, *useZoom*.

These define the core functionality and are quite flexible. Most importantly, they do what you would expect them to do.
- *useAxis*: generates a axis element, a corresponding D3 scale, and exposes a function to rescale the axis.
- *useAreaStack*: generate a path element (the area) and exposes a function to rescale/zoom it.
- *useBrush*: exposes a React Ref which may be applied to the element to be brushed, and a function to programmatically set the brush. It also allows the user to pass a callback for when a brush change happens.
- *useZoom*: exposes a React Ref which may be applied to the SVG element to which the zoom behavior should be applied, and a function to programmatically zoom. What is zoomed is determined by a user-defined list of callbacks which are called upon each zoom event.

There are additional hooks which combine these base ones to provide a mid-level of abstraction.

**Limitations:**

- This was primarily designed to organize the code necessary for a single type of chart, which limits its scope severely. However, I took care to design interfaces that are generalizzabile at least to a 2D domain, meaning that what's needed to implement, for example, a 2D zoom hook is simply to expand its internal logic to apply to both dimensions. For this reason it should be possible to expand on this approach relatively easily as long as the general format of the chart remains unchanged.

- An additional limitation of this approach is that hooks must always be called in the same order. For this reason disabling only, for example, the brush (which relies on a hook) requires either bearing its computational costs and using the hook without linking it to the rest of the chart or using a wrapper component to switch between two chart variants. 
A more complex solution might allow the hook user to disable some functionality via props, but it might result in unnecessary complexity especially considering that charts significantly different in computational cost (and thus in which this might be worth it) are usually truly different charts (as is the case with the desktop and mobile versions in this project).

- Two-fingers side scrolling on the desktop is calibrated to my device and there has been no testing to make it work well across browsers, trackpads, and operating systems. The brush should work well in any configuration however.

- Of note is also the fact that currently normal scrolling on mobile does not work if the touch event is initiated on the chart. This is because, by defualt, it is interpreted as panning and defaults are prevented. This can be solved only by redefining the entire touch-based pan/zoom behavior or modifying the library itself. [There's an issue on this already]

- The final limitation of this implementation is that currently it does not allow programmatic interactions from outside the components, in the future lifting the DataDomain refs might be an effective way to implement this up to an arbitrary point in the parent's hierarchy.


[There's an issue on this already]: https://github.com/d3/d3-zoom/issues/186
