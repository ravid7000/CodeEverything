/** Server emits a placeholder; client `hydrateIslands()` mounts the real component. */
export function Island({ name, props }: { name: string; props: Record<string, unknown> }) {
  return (
    <div
      data-island={name}
      data-props={JSON.stringify(props)}
    />
  );
}
