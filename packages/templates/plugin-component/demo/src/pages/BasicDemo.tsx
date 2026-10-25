import { __NAME__Core, withPlugins } from "../../../src";
import { createExamplePlugin } from "../../../src/custom-plugins/ExamplePlugin";

const Enhanced = withPlugins(__NAME__Core, [
  createExamplePlugin({ text: "ExamplePlugin" }),
]);

const items = Array.from({ length: 6 }, (_, i) => ({ id: String(i), label: `item ${i}` }));

export function BasicDemo() {
  return (
    <Enhanced
      items={items}
      renderItem={(item) => (
        <div key={item.id} style={{ padding: 12, borderBottom: "1px solid #eee" }}>
          {item.label}
        </div>
      )}
      containerStyle={{ maxWidth: 480 }}
    />
  );
}
