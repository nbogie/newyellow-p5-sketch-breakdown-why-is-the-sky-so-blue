import { sleep } from "./animUtils.js";
import { getAngle } from "./CircleData.js";
import { makeCloudPaths } from "./cloudPaths.js";

const cfg = {
    lineWaveNoiseScale: 0.02,
    lineWavingLength: 3,
    lineThickness: 6,
    lineDensity: 0.15,
    lineSizeNoiseScale: 0.02,
    dotDensity: 0.8,
    dotSize: [1, 3],
    myColour: undefined,
    pointNoiseScaleX: 0.06,
    pointNoiseRadius: 3,
};

//this is not config, it is state which changes during the animated render process
let pointNoiseX = 0;

async function setup() {
    createCanvas(windowWidth, windowHeight);
    background(240);

    cfg.myColour = color(15, 71, 140);

    // background
    const padding = 0.06 * min(width, height);

    cfg.dotDensity = random(0.5, 0.8);
    cfg.lineDensity = random(0.06, 0.2);
    cfg.lineWaveNoiseScale = random(0.02, 0.12);
    cfg.dotSize = [1, 3];
    await NYRect(padding, padding, width - padding * 2, height - padding * 2);

    // top frame
    cfg.dotSize = [0, 6];
    NYLineVerticalWithNoise(padding, padding, width - padding, padding);

    cfg.dotSize = [1, 3];

    const { paths, cloudPaths } = await makeCloudPaths(padding);

    // paint cloud lines from cloudPaths[]
    for (let p = 0; p < cloudPaths.length; p++) {
        /** the current cloudPath being painted */
        let nowPath = cloudPaths[p];

        // fill cloud path
        for (let i = 0; i < nowPath.length; i++) {
            let x1 = nowPath[i].x;
            let y1 = nowPath[i].y;

            let x2 = x1;
            let y2 = height;

            stroke(240);
            line(x1, y1, x2, y2);

            if (i % 100 == 0) await sleep(1);
        }

        // draw cloud path
        let shadeNX = random(-1000, 1000);
        let shadeNScale = random(0.003, 0.02);
        let shadeChance = random(0.6, 0.8);

        //always, for first cloudPath
        if (p == 0) shadeChance = 1;

        for (let i = 0; i < nowPath.length; i++) {
            let x1 = nowPath[i].x;
            let y1 = nowPath[i].y;

            if (x1 < padding || x1 > width - padding) continue;

            shadeNX += shadeNScale;
            let shadeNoise = noise(shadeNX);

            if (shadeNoise < shadeChance) {
                let shadeT = map(shadeNoise, 0, shadeChance, 1, 0);
                let shadeScaler = 1.0;

                if (shadeT < 0.2) shadeScaler = shadeT / 0.2;

                noStroke();
                cfg.myColour.setAlpha(255 * random(0.4, 0.8));
                fill(cfg.myColour);
                NoisePoint(x1, y1, shadeScaler);

                if (i % 20 == 0) await sleep(1);
            }
        }

        // draw cloud shade
        let cloudPadding = random(60, 200);
        let cloudPaddingNX = random(-1000, 1000);
        let cloudPaddingNScale = 0.03;
        // let cloudLineSpacing = floor(random(6, 18));
        let cloudLineSpacing = floor(1.0 / cfg.lineDensity);

        //don't do what comes after for last cloudPath
        if (p == paths.length - 1) break;

        for (let i = 0; i < nowPath.length; i++) {
            let x1 = nowPath[i].x;
            let y1 = nowPath[i].y;

            let x2 = x1;
            let y2 = height - padding;

            if (floor(x1) % cloudLineSpacing != 0) continue;

            if (x1 < padding || x1 > width - padding) continue;

            cloudPaddingNX += cloudPaddingNScale;
            let paddingNoise = noise(cloudPaddingNX);

            y1 += cloudPadding * paddingNoise;
            // y1 += random(10, 60);

            if (random() < 0.9) NYLineVerticalWithNoise(x1, y1, x2, y2);

            if (i % 200) await sleep(1);
        }
    }

    // frame
    cfg.dotSize = [0, 6];
    NYLineVerticalWithNoise(padding, padding, padding, height - padding);
    NYLineVerticalWithNoise(
        width - padding,
        padding,
        width - padding,
        height - padding
    );
    NYLineVerticalWithNoise(
        padding,
        height - padding,
        width - padding,
        height - padding
    );

    cfg.dotSize = [1, 3];

    // draw last cloud white
    let nowPath = cloudPaths[cloudPaths.length - 1];

    // fill cloud path
    for (let i = 0; i < nowPath.length; i++) {
        let x1 = nowPath[i].x;
        let y1 = nowPath[i].y;

        let x2 = x1;
        let y2 = height;

        stroke(240);
        line(x1, y1, x2, y2);

        if (i % 100 == 0) await sleep(1);
    }

    // draw cloud path
    let shadeNX = random(-1000, 1000);
    let shadeNScale = random(0.003, 0.02);
    let shadeChance = random(0.6, 0.8);

    shadeChance = 1;

    for (let i = 0; i < nowPath.length; i++) {
        let x1 = nowPath[i].x;
        let y1 = nowPath[i].y;

        if (x1 < padding || x1 > width - padding) continue;

        shadeNX += shadeNScale;
        let shadeNoise = noise(shadeNX);

        if (shadeNoise < shadeChance) {
            let shadeT = map(shadeNoise, 0, shadeChance, 1, 0);
            let shadeScaler = 1.0;

            if (shadeT < 0.2) shadeScaler = shadeT / 0.2;

            noStroke();
            cfg.myColour.setAlpha(255 * random(0.4, 0.8));
            fill(cfg.myColour);
            NoisePoint(x1, y1, shadeScaler);

            if (i % 20 == 0) await sleep(1);
        }
    }

    // draw cloud shade
    let cloudPadding = random(60, 200);
    let cloudPaddingNX = random(-1000, 1000);
    let cloudPaddingNScale = 0.03;
    // let cloudLineSpacing = floor(random(6, 18));
    let cloudLineSpacing = floor(1.0 / cfg.lineDensity);

    for (let i = 0; i < nowPath.length; i++) {
        let x1 = nowPath[i].x;
        let y1 = nowPath[i].y;

        let x2 = x1;
        let y2 = height - padding;

        if (floor(x1) % cloudLineSpacing != 0) continue;

        if (x1 < padding || x1 > width - padding) continue;

        cloudPaddingNX += cloudPaddingNScale;
        let paddingNoise = noise(cloudPaddingNX);

        y1 += cloudPadding * paddingNoise;
        // y1 += random(10, 60);

        if (random() < 0.9) NYLineVerticalWithNoise(x1, y1, x2, y2);

        if (i % 200) await sleep(1);
    }
}

function draw() {}

async function NYRect(_x, _y, _width, _height) {
    let xLines = _width * cfg.lineDensity;
    let xLineSpace = _width / (xLines - 1);

    for (let x = 0; x < xLines; x++) {
        let x1 = _x + x * xLineSpace;
        let y1 = _y;

        let x2 = x1;
        let y2 = _y + _height;

        NYLineVerticalWithNoise(x1, y1, x2, y2);
        await sleep(1);
    }
}

function NYLineVerticalWithNoise(_x1, _y1, _x2, _y2) {
    let dotCount = dist(_x1, _y1, _x2, _y2) * cfg.dotDensity;

    let forwardAngle = getAngle(_x1, _y1, _x2, _y2);

    for (let i = 0; i < dotCount; i++) {
        let t = i / dotCount;
        let xPos = lerp(_x1, _x2, t);
        let yPos = lerp(_y1, _y2, t);

        let sizeNoise = noise(
            xPos * cfg.lineSizeNoiseScale,
            yPos * cfg.lineSizeNoiseScale,
            666
        );
        let waveNoise = noise(
            xPos * cfg.lineWaveNoiseScale,
            yPos * cfg.lineWaveNoiseScale,
            999
        );

        let nowDotSize = lerp(cfg.dotSize[0], cfg.dotSize[1], sizeNoise);

        // let wavingNoise = noise(xPos * 0.01, yPos * 0.01, 999) * 2 - 1;
        xPos += sin(radians(forwardAngle)) * cfg.lineWavingLength * waveNoise;
        yPos -= cos(radians(forwardAngle)) * cfg.lineWavingLength * waveNoise;

        strokeWeight(cfg.lineThickness);
        cfg.myColour.setAlpha(255 * random(0.3, 0.6));
        fill(cfg.myColour);
        noStroke();

        circle(xPos, yPos, nowDotSize);
    }
}

function NoisePoint(_x, _y, _scaler = 1) {
    pointNoiseX += cfg.pointNoiseScaleX;
    let offsetY = (noise(pointNoiseX) - 0.5) * 2 * cfg.pointNoiseRadius;

    let sizeNoise = noise(
        _x * cfg.lineSizeNoiseScale,
        _y * cfg.lineSizeNoiseScale,
        666
    );
    let nowDotSize = lerp(cfg.dotSize[0], cfg.dotSize[1], sizeNoise);

    circle(_x, _y + offsetY, nowDotSize * _scaler);
}

window.setup = setup;
window.draw = draw;
