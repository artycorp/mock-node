import Koa, { Middleware } from 'koa';
import Router from 'koa-router';
import Client from 'prom-client';

const PORT = 8080;
const app = new Koa();
const router = new Router();
const register = new Client.Registry();

register.setDefaultLabels({
    app: 'example-nodejs-app'
});

const summary = new Client.Summary({
    name: 'request_count',
    help: 'Count of request',
    percentiles: [0.01, 0.1, 0.5, 0.75, 0.9, 0.99]
});

register.registerMetric(summary);

function sleep(ms: any) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

var time_to_sleep = 1;

const perfController: Middleware = async (ctx) => {
    //console.log('received a request');
    const end_timer = summary.startTimer()
    await sleep(time_to_sleep * 1000);
    time_to_sleep = time_to_sleep + 1;
    if (time_to_sleep > 4) {
        time_to_sleep = 1;
    }
    ctx.body = {
        message: 'Hello world',
    };
    end_timer();
};

const metricsController: Middleware = async (ctx) => {
    ctx.response.set('Content-Type', register.contentType);
    ctx.response.body = await register.metrics();
};

Client.collectDefaultMetrics({ register });

router.get('/', perfController);
router.get('/metrics', metricsController);

app.use(router.routes()).use(router.allowedMethods());
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});



