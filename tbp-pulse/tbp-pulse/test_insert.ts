import { supabase } from "./src/lib/supabase";
async function run() {
  const { data, error } = await supabase.from("tasks").insert([{
    project_id: 1,
    title: "[VIDEO] Test",
    description: "{}",
    status: "todo",
    assignee: "GB",
    deadline: new Date().toISOString().split("T")[0]
  }]);
  console.log(error || "Success");
}
run();
