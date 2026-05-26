import { Tabs } from "./Tabs";

export function App() {
  const items = [
    {
      title: "item 1",
      content: "content 1"
    },
    {
      title: "item 2",
      content: "content 2"
    },
    {
      title: "item 3",
      content: "content 3"
    },
  ]

  return (
    <div>
      <h1>Tabs</h1>
      <p>@code-everything/tabs</p>

      <Tabs items={items} />
    </div>
  );
}
