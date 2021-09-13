import Koa, { Middleware } from 'koa';
import Router from 'koa-router';
import Client from 'prom-client';

const PORT = 80;
const METRICS_PORT = 9270;
const app = new Koa();
const metric_app = new Koa();
const metric_router = new Router();
const router = new Router();
const register = new Client.Registry();

register.setDefaultLabels({
    app: 'example-nodejs-app'
});

const summaryFirst = new Client.Summary({
    name: 'first_request_count',
    help: 'Count of request',
    percentiles: [0.01, 0.1, 0.5, 0.75, 0.9, 0.99]
});

const summarySecond = new Client.Summary({
    name: 'second_request_count',
    help: 'Count of request',
    percentiles: [0.01, 0.1, 0.5, 0.75, 0.9, 0.99]
});

register.registerMetric(summaryFirst);
register.registerMetric(summarySecond);

function sleep(ms: any) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

var time_to_sleep_first = 1;
var time_to_sleep_second = 5;

const firstController: Middleware = async (ctx) => {
    //console.log('received a request');
    const end_timer = summaryFirst.startTimer()
    await sleep(time_to_sleep_first * 1000);
    time_to_sleep_first = time_to_sleep_first + 1;
    if (time_to_sleep_first > 4) {
        time_to_sleep_first = 1;
	    ctx.status = 404;
    }
    ctx.body = {
        message: 'First controller',
    };
    end_timer();
};

const secondController: Middleware = async (ctx) => {
    const end_timer = summarySecond.startTimer()
    await sleep(time_to_sleep_second * 1000);
    time_to_sleep_second = time_to_sleep_second + 1;
    if (time_to_sleep_second > 9) {
        time_to_sleep_second = 5;
    }
    ctx.body = {
        message: 'Second controller',
    };
    end_timer();
};

const metricsController: Middleware = async (ctx) => {
    ctx.response.set('Content-Type', register.contentType);
    ctx.response.body = await register.metrics();
};

Client.collectDefaultMetrics({ register });

router.get('/first', firstController);
router.get('/second', secondController);

metric_router.get('/metrics', metricsController);

app.use(router.routes()).use(router.allowedMethods());
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

metric_app.use(metric_router.routes()).use(metric_router.allowedMethods());

metric_app.listen(METRICS_PORT, () => {
    console.log(`Server metrics is running on port ${METRICS_PORT}`);
});