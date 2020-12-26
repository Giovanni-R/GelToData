# ***GelToData***

[GelToData] is a small web app which allows you to take an image of a gel electrophoresis experiment and extract the lanes as raw data.

> [Gel electrophoresis] is a technique to separate molecules depending on their size, shape, and charge. The output of its 1D variant is a distinctive set of lanes in which a number of bands may appear. It is most notoriously used to separate DNA fragments.

**About this explorative side project:**

- *Tagline:* easily convert a gel electrophoresis image to quantitative data.
- *Explores:* in-browser scientific processing; visualisation of datasets of non-trivial cardinality.
- *Features:* fully type-checked web-worker interface; custom React-D3 integration that preserves D3 speed and React composability.

**How does it work?**
1. Import an image.
2. Select the desired pre-processing options, any change will be quickly reflected in the images and charts.
3. Select the number of lanes, and position them on the gel.
4. Reveal and navigate the charts. You may rename the lanes by clicking/tapping on 'Lane #'.
5. Download the dataset as a csv file, each lane will correspond to a row and use the user-defined name (or the default names).

**Features:**
- High bit depth images preserve their richer information.
- The web app works entirely offline.
- The web app uses Web Workers to process the image in the background without blocking the main thread.
- Communication with the Web Worker is typechecked. [***[see how]***][WebWorkerReadme]
- Images are manipulated mainly through [image-js].
- The charts are written in D3, with the code organized in hooks. [***[see the reasoning]***][D3HooksReadme]
- The charts display every pixel of height and employ a custom zoom on the desktop to allow for two-finger side scrolling.


[GelToData]: https://geltodata.web.app/
[WebWorkerReadme]: ./src/Workers/README.md
[image-js]: https://www.npmjs.com/package/image-js
[D3HooksReadme]: ./src/Components/Charts/README.md
[Gel electrophoresis]: https://en.wikipedia.org/wiki/Gel_electrophoresis
