import { analytics } from "./firebase";
import {
  ref,
  set
} from "firebase/analytics";

export async function testFirebase() {

  const testRef =
    ref(analytics, "farmPulse/test");

  await set(testRef, {
    message: "FarmPulse Firebase connected!",
    time: Date.now()
  });

  console.log(
    "Firebase connection successful!"
  );
}