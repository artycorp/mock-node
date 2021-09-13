import http from "k6/http";
import { sleep, check } from "k6";
import { Trend } from 'k6/metrics';
//import { Counter } from "k6/metrics";

// A simple counter for http requests
//export const requests = new Counter("http_reqs");

// you can specify stages of your test (ramp up/down patterns) through the options object
// target is the number of VUs you are aiming for

/* export const options = {
  stages: [
    { target: 20, duration: "1m" },
    { target: 15, duration: "1m" },
    { target: 0, duration: "1m" },
  ],
  thresholds: {
    requests: ["count < 100"],
  },
}; */

/* you can add some user metrics */
//let durationTrendByTag = new Trend('Duration Trend by Tag');
//let successRateByTag = new Rate('Success Rate by Tag');
let serverWaitingTime = new Trend('serverWaitingTime', true);

export let options = {
  scenarios: {
    constant_request_rate: {
      executor: "constant-arrival-rate",
      rate: 100,
      timeUnit: "1s", // 1000 iterations per second, i.e. 100 RPS
      duration: "1m",
      preAllocatedVUs: 300, // how large the initial pool of VUs would be
      maxVUs: 1000, // if the preAllocatedVUs are not enough, we can initialize more
    },
  },
};

export default function () {
  // our HTTP request, note that we are saving the response to res, which can be accessed later

  const res = http.get("http://10.151.50.222/", {tags: {simple: "hi"}});
  
  serverWaitingTime.add(res.timings.waiting);

  const checkRes = check(res, {
    "status is 200": (r) => r.status === 200,
  });
}
