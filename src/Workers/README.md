# On this Web Worker implementation:

**Why:**

I decided to implement this Web Worker interface for two main reasons:
- I wanted a simpler way to comunicate with the Worker which retained a high level of flexibility.
- I wanted any communication to the Worker and back to be structured and ***typechecked***.

**How:**

By defining two interfaces I restricted the structure of messages which may be shared:

```Typescript
interface WorkerInterface {
  /** Identifies the kind of message sent to or received by the Web Worker */
  target: string,
  /** The message payload. */
  value: any,
  /** Identifies the transaction when needed. */
  interactionID?: number,
}

interface WorkerSubscriptionInterface<Output extends WorkerInterface> {
  target: string,
  callback: (output: Output["value"], interactionID?: number) => void,
}
```

Here the `target` field is used to identify the kind of message that the Worker or user will receive and may restrict the kind of `value` the message is allowed to have by way of user-defined types.

The interface is then personalized by the user with **custom types** and the **generics** of the hook.

Here is an example taken from the project:

```Typescript
// Some targets have been removed for clarity
type WorkerInput = ({
  target: "original gel",
  value: string,
  interactionID?: number,
} | {
  target: "preprocessing settings",
  value: imagePreProcessingOptions,
  interactionID?: number,
});

type WorkerOutput = ({
  target: "processed gel",
  value: string,
  interactionID?: number,
} | {
  target: "processed channels",
  value: string[],
  interactionID?: number,
});

type WorkerOutputSubscription = ({
  target: "processed gel",
  callback: (output: WorkerOutput["value"], interactionID?: number) => void,
} | {
  target: "processed channels",
  callback: (output: WorkerOutput["value"], interactionID?: number) => void,
});
```

As it is evident from the examples, messages to and from the worker are restricted to an union type in which available `target` and `value` pairs are defined, allowing for strict typechecking.

**Result:**

The upside of this small interface is the ability to use a Worker by first defining the message types and then using the hook to get two *typechecked* callbacks for subscription or sending messages to the Worker.

**Limitations:**

The main limitations are two and are both related to `WorkerSubscriptionInterface`:
- The subscription type must be re-defined for each `target`, which means the user must repeat itself as it closely mirrors `WorkerOutput`.
- The `output` parameter in the `callback` property is not currently fully typechecked, as it is the union value of all the possible types that the `value` property of `WorkerOutput` may take.