const notYetWiredMessage =
  'Diff Review production entry reached; local session launch is not wired yet.';

export async function run(): Promise<void> {
  console.log(notYetWiredMessage);
}
