// 獲取canvas和context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// 設置canvas大小為320x480
canvas.width = 320;
canvas.height = 480;

// 角色屬性（作為反擊板）
let characterOriginalWidth = 158; // 角色的原始寬度
let characterOriginalHeight = 100; // 角色的原始高度

// 將角色縮放至原始大小的一半
let characterWidth = characterOriginalWidth / 2.5;
let characterHeight = characterOriginalHeight / 2.5;
let characterX = (canvas.width - characterWidth) / 2;
let characterY = canvas.height - characterHeight; // 將角色定位於canvas的底部

// 圖像資源
const characterImage = new Image();
characterImage.src = './images/character.png';
const ballImage = new Image();
ballImage.src = './images/drill.png';
const brickImage = new Image();
brickImage.src = './images/brick.png';
const coinImage = new Image();
coinImage.src = './images/coin.png';
const minusImage = new Image(); // 新增 minus 圖像
minusImage.src = './images/minus.png';
const plusImage = new Image(); // 新增 plus 圖像
plusImage.src = './images/plus.png';
const characterSmallImage = new Image(); // 角色縮小圖像
characterSmallImage.src = './images/character_small.png';
const characterBigImage = new Image(); // 角色放大圖像
characterBigImage.src = './images/character_big.png';
const backgroundImage = new Image();
backgroundImage.src = './images/background.png';

// 紀錄當前的效果
let currentEffect = null;
let effectTimeout = null;

// 球的屬性
let ballRadius = 10;
let x = canvas.width / 2; // 將球的初始X位置設為畫布的中間
let y = canvas.height - characterHeight - ballRadius - 20; // 將球的初始Y位置設為角色上方約20像素的位置
let dx = 3 * 0.7 * (Math.random() < 0.5 ? 1 : -1); // 隨機設置水平速度並降低70%
let dy = -3 * 0.7; // 垂直速度向上並降低70%

// 磚塊屬性
const brickRowCount = 1; // 1行磚塊
const brickColumnCount = 10; // 每行10個磚塊
const brickWidth = canvas.width / brickColumnCount; // 每個磚塊的寬度根據列數調整
const brickHeight = 20;
const brickOffsetTop = 80; // 磚塊距離頂部的距離

// 初始化磚塊陣列
const bricks = [];
for (let c = 0; c < brickColumnCount; c++) {
    bricks[c] = [];
    for (let r = 0; r < brickRowCount; r++) {
        bricks[c][r] = { x: 0, y: 0, status: 1 }; // status為1表示磚塊存在
    }
}

// 屋頂屬性
const roofHeight = 40; // 屋頂區域的高度

// 硬幣屬性
let coins = [];
const coinRadius = 14;
let collectedCoins = 0; // 已收集的硬幣數

// 遊戲狀態屬性
let gameStarted = false; // 遊戲是否已經開始
let score = 0; // 得分
let timeElapsed = 0; // 已經過的時間
let timerInterval; // 計時器的間隔

// 音效資源
let brickHitSound, gameOverSound, gameWinSound, coinCollectSound, backgroundMusic;

// 載入音效資源
function loadSounds() {
    brickHitSound = new Audio('./sounds/brick-hit.mp3');
    gameOverSound = new Audio('./sounds/game-over.mp3');
    gameWinSound = new Audio('./sounds/game-win.mp3');
    coinCollectSound = new Audio('./sounds/coin-collect.mp3');
    backgroundMusic = new Audio('./sounds/background-music.mp3');
    backgroundMusic.loop = true; // 設置背景音樂循環播放
}

// 開始播放背景音樂
function startBackgroundMusic() {
    backgroundMusic.play();
}

// 停止背景音樂
function stopBackgroundMusic() {
    backgroundMusic.pause();
    backgroundMusic.currentTime = 0; // 重置音樂到開始位置
}

// 初始化遊戲，顯示遊戲畫面和提示訊息
function initializeGame(playerName) {
    drawGameElements(); // 繪製遊戲背景、磚塊、角色、球等元素
    showStartMessage(); // 顯示操作提示訊息和「開始遊戲」按鈕
}

// 繪製所有遊戲元素，但遊戲尚未開始
function drawGameElements() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // 清除畫布
    drawBackground(); // 繪製背景
    drawBricks(); // 繪製磚塊
    drawCharacter(); // 繪製角色
    drawBall(); // 繪製球
    drawScoreAndTime(); // 繪製分數和時間（可選）
}

// 顯示開始遊戲前的提示訊息
function showStartMessage() {
    ctx.font = "20px Arial";
    ctx.fillStyle = "#0095DD";
    ctx.textAlign = "center";
    ctx.fillText("操作方式", canvas.width / 2, canvas.height / 2 - 60);
    ctx.fillText("電腦: 左右鍵", canvas.width / 2, canvas.height / 2 - 30);
    ctx.fillText("手機: 移動反擊板", canvas.width / 2, canvas.height / 2);

    const startBtn = document.createElement('button');
    startBtn.innerText = "開始遊戲";
    startBtn.style.position = 'absolute';
    startBtn.style.top = canvas.offsetTop + canvas.height / 2 + 30 + 'px';
    startBtn.style.left = canvas.offsetLeft + canvas.width / 2 + 'px';
    startBtn.style.transform = 'translate(-50%, -50%)';
    document.body.appendChild(startBtn);

    startBtn.addEventListener('click', function () {
        startBtn.style.display = 'none'; // 隱藏按鈕
        ctx.clearRect(0, canvas.height / 2 - 80, canvas.width, 160); // 清除提示訊息
        startGameHandler(); // 開始遊戲
    });
}

// 監聽鍵盤按鍵事件
let rightPressed = false;
let leftPressed = false;

document.addEventListener("keydown", keyDownHandler, false);
document.addEventListener("keyup", keyUpHandler, false);

// 監聽觸摸事件
canvas.addEventListener('touchstart', touchStartHandler, false);
canvas.addEventListener('touchmove', touchMoveHandler, false);
canvas.addEventListener('touchend', touchEndHandler, false);

// 角色移動函數
function keyDownHandler(e) {
    if (e.key == "Right" || e.key == "ArrowRight") {
        rightPressed = true; // 設置右鍵按下狀態
    } else if (e.key == "Left" || e.key == "ArrowLeft") {
        leftPressed = true; // 設置左鍵按下狀態
    }
}

function keyUpHandler(e) {
    if (e.key == "Right" || e.key == "ArrowRight") {
        rightPressed = false; // 取消右鍵按下狀態
    } else if (e.key == "Left" || e.key == "ArrowLeft") {
        leftPressed = false; // 取消左鍵按下狀態
    }
}

// 觸摸開始時的處理函數
function touchStartHandler(e) {
    e.preventDefault(); // 阻止默認事件，如滾動
    const touch = e.touches[0];
    const touchX = touch.clientX - canvas.offsetLeft;

    if (touchX > characterX && touchX < characterX + characterWidth) {
        // 如果觸摸點在角色上，則記錄開始觸摸的位置
        rightPressed = false;
        leftPressed = false;
    } else if (touchX > characterX + characterWidth) {
        rightPressed = true;
        leftPressed = false;
    } else if (touchX < characterX) {
        leftPressed = true;
        rightPressed = false;
    }
}

// 觸摸移動時的處理函數
function touchMoveHandler(e) {
    e.preventDefault(); // 阻止默認事件，如滾動
    const touch = e.touches[0];
    const touchX = touch.clientX - canvas.offsetLeft;

    if (touchX > canvas.width - characterWidth / 2) {
        characterX = canvas.width - characterWidth;
    } else if (touchX < characterWidth / 2) {
        characterX = 0;
    } else {
        characterX = touchX - characterWidth / 2;
    }
}

// 觸摸結束時的處理函數
function touchEndHandler(e) {
    e.preventDefault(); // 阻止默認事件，如滾動
    rightPressed = false;
    leftPressed = false;
}

// 開始遊戲的主要邏輯
function startGameHandler() {
    if (!gameStarted) {
        gameStarted = true; // 在第一時間內設置遊戲狀態為開始，避免多次點擊
        loadSounds(); // 載入音效
        startBackgroundMusic(); // 播放背景音樂

        timerInterval = setInterval(function () {
            timeElapsed += 0.01; // 增加時間
            drawScoreAndTime(); // 繪製得分和時間
        }, 10);

        requestAnimationFrame(draw); // 開始遊戲循環
    }
}

// 繪製背景
function drawBackground() {
    ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
}

// 繪製角色
function drawCharacter() {
    ctx.drawImage(characterImage, characterX, characterY, characterWidth, characterHeight);
}

// 繪製球
function drawBall() {
    const scaleFactor = 0.8; // 縮放比例為 80%
    const scaledRadius = ballRadius * scaleFactor; // 根據縮放比例計算縮放後的半徑

    ctx.save(); // 保存當前的繪製狀態
    ctx.translate(x, y); // 將原點移動到球的中心
    ctx.rotate((90 * Math.PI) / 180); // 將圖像順時針旋轉90度
    ctx.drawImage(ballImage, -scaledRadius, -scaledRadius, scaledRadius * 2, scaledRadius * 2); // 根據縮放後的大小繪製球
    ctx.restore(); // 恢復繪製狀態
}

// 繪製硬幣
function drawCoins() {
    const scaleFactor = 0.8; // 縮放比例為 80%
    const scaledRadius = coinRadius * scaleFactor; // 根據縮放比例計算縮放後的半徑

    for (let i = 0; i < coins.length; i++) {
        if (coins[i].active) {
            ctx.save(); // 保存當前的繪製狀態
            ctx.translate(coins[i].x, coins[i].y); // 將原點移動到硬幣的中心
            ctx.scale(scaleFactor, scaleFactor); // 按照縮放比例縮放圖像
            if (coins[i].type === 'coin') {
                ctx.drawImage(coinImage, -scaledRadius, -scaledRadius, scaledRadius * 2, scaledRadius * 2);
            } else if (coins[i].type === 'minus') {
                ctx.drawImage(minusImage, -scaledRadius, -scaledRadius, scaledRadius * 2, scaledRadius * 2);
            } else if (coins[i].type === 'plus') {
                ctx.drawImage(plusImage, -scaledRadius, -scaledRadius, scaledRadius * 2, scaledRadius * 2);
            }
            ctx.restore(); // 恢復繪製狀態
        }
    }
}

// 更新代幣狀況
function updateCoins() {
    for (let i = 0; i < coins.length; i++) {
        if (coins[i].active) {
            coins[i].y += 2; // 硬幣向下移動
            // 檢查硬幣是否被收集
            if (coins[i].y + coinRadius > canvas.height - characterHeight &&
                coins[i].x > characterX && coins[i].x < characterX + characterWidth) {
                coins[i].active = false;
                if (coins[i].type === 'coin') {
                    collectedCoins -= 1; // 陰德減少1
                    coinCollectSound.play(); // 播放收集硬幣音效
                } else if (coins[i].type === 'minus') {
                    applyEffect('minus', './images/character_small.png', 100, 100);
                } else if (coins[i].type === 'plus') {
                    applyEffect('plus', './images/character_big.png', 313, 100); // 假設 character_big 的大小為 313x100
                }
            }
            if (coins[i].y > canvas.height) {
                coins[i].active = false; // 硬幣移出畫面後不再顯示
            }
        }
    }
}



function applyEffect(effectType, imagePath, newWidth, newHeight) {
    // 清除当前的效果计时器
    clearTimeout(effectTimeout);

    // 无论效果是否相同，切换到新的效果
    currentEffect = effectType;
    characterImage.src = imagePath;
    characterWidth = newWidth / 2.5;
    characterHeight = newHeight / 2.5;

    // 重新开始10秒计时
    effectTimeout = setTimeout(function () {
        // 恢复到初始状态
        characterImage.src = './images/character.png';
        characterWidth = characterOriginalWidth / 2.5;
        characterHeight = characterOriginalHeight / 2.5;
        currentEffect = null; // 清除当前效果
    }, 10000);
}




// 繪製磚塊
function drawBricks() {
    for (let r = 0; r < brickRowCount; r++) {
        for (let c = 0; c < brickColumnCount; c++) {
            if (bricks[c][r].status == 1) {
                const brickX = c * brickWidth;
                const brickY = r * brickHeight + brickOffsetTop;
                bricks[c][r].x = brickX;
                bricks[c][r].y = brickY;
                ctx.drawImage(brickImage, brickX, brickY, brickWidth, brickHeight);
            }
        }
    }
}


// 碰撞檢測邏輯
function collisionDetection() {
    let bricksRemaining = 0;
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            let b = bricks[c][r];
            if (b.status == 1) {
                bricksRemaining++;
                // 檢查球是否撞到磚塊
                if (x > b.x && x < b.x + brickWidth && y > b.y && y < b.y + brickHeight) {
                    dy = -dy; // 反轉球的垂直方向
                    b.status = 0; // 設置磚塊為被擊中狀態
                    brickHitSound.play(); // 播放磚塊被擊中音效
                    score += 10; // 增加得分
                    drawScoreAndTime(); // 更新分數顯示

                    let randomDrop = Math.random();
                    if (randomDrop < 0.2) { // 20% 機率掉落 coin
                        coins.push({
                            x: b.x + brickWidth / 2,
                            y: b.y,
                            active: true,
                            type: 'coin'
                        });
                    } else if (randomDrop < 0.5) { // 30% 機率掉落 minus
                        coins.push({
                            x: b.x + brickWidth / 2,
                            y: b.y,
                            active: true,
                            type: 'minus'
                        });
                    } else if (randomDrop < 0.8) { // 30% 機率掉落 plus
                        coins.push({
                            x: b.x + brickWidth / 2,
                            y: b.y,
                            active: true,
                            type: 'plus'
                        });
                    }
                }
            }
        }
    }

    // 檢查是否所有磚塊都已被擊毀
    if (bricksRemaining === 0) {
        setTimeout(function () {
            gameWin(); // 顯示「主委加碼」
        }, 100);
        return true;
    }

    // 檢查球是否撞到牆壁和角色
    if (x + dx > canvas.width - ballRadius || x + dx < ballRadius) {
        dx = -dx; // 反轉水平方向
    }
    if (y + dy < ballRadius) {
        dy = -dy; // 反轉垂直方向
    } else if (y > canvas.height - characterHeight - ballRadius) {
        // 檢查球是否撞到角色（反擊板）
        if (x > characterX - ballRadius && x < characterX + characterWidth + ballRadius) {
            let relativeX = x - characterX;
            let offset = (relativeX / characterWidth - 0.5) * 0.25; // 調整影響範圍

            if (relativeX < characterWidth * 0.25 || relativeX > characterWidth * 0.75) {
                dx = offset * 4; // 減小邊緣處的速度變化
            } else {
                dx = offset * 8; // 保持中間區域的反應
            }

            dy = -dy; // 反轉垂直方向
        } else {
            setTimeout(function () {
                gameOver(); // 顯示「得罪了！」並停止遊戲
            }, 100);
            return;
        }
    }

    return false;
}


// 繪製分數和時間，並顯示屋頂
function drawScoreAndTime() {
    ctx.clearRect(0, 0, canvas.width, roofHeight); // 清除屋頂區域
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, roofHeight);

    if (gameStarted) {
        ctx.font = "16px 'Press Start 2P', cursive"; // 使用像素風格字體
        ctx.fillStyle = "#0095DD";
        ctx.textAlign = "center";
        ctx.fillText("陰德: " + collectedCoins, canvas.width / 4, 30);
        ctx.fillText("時間: " + timeElapsed.toFixed(2) + " 秒", (canvas.width / 4) * 3, 30);
    }
}


// 顯示遊戲結束或勝利訊息
function showMessage(message, isWin) {
    clearInterval(timerInterval); // 停止計時
    gameStarted = false; // 設置遊戲狀態為未開始

    ctx.font = "20px Arial";
    ctx.fillStyle = "#FF0000";
    ctx.textAlign = "center";
    ctx.fillText(message, canvas.width / 2, canvas.height / 2 - 20);

    // 如果已經存在重新挑戰按鈕，先移除
    let existingRestartBtn = document.getElementById('restartButton');
    if (existingRestartBtn) {
        existingRestartBtn.remove();
    }

    const restartBtn = document.createElement('button');
    restartBtn.innerText = "重新挑戰";
    restartBtn.id = "restartButton";  // 為按鈕分配一個唯一的 ID
    restartBtn.style.position = 'absolute';
    restartBtn.style.top = canvas.offsetTop + canvas.height / 2 + 'px'; // 修正位置
    restartBtn.style.left = canvas.offsetLeft + canvas.width / 2 + 'px'; // 修正位置
    restartBtn.style.transform = 'translate(-50%, -50%)';
    document.body.appendChild(restartBtn);

    restartBtn.addEventListener('click', function () {
        resetGame(); // 重新開始遊戲
    });
}

// 重置遊戲的函數
function resetGame() {
    // 停止任何正在進行的動畫和計時器
    cancelAnimationFrame(draw); // 停止繪製動畫
    clearInterval(timerInterval); // 停止計時

    // 確保重新挑戰按鈕被隱藏或移除
    const restartBtn = document.getElementById('restartButton');
    if (restartBtn) {
        restartBtn.remove(); // 移除重新挑戰按鈕
    }

    // 重置遊戲狀態
    gameStarted = false;
    score = 0;
    timeElapsed = 0;
    collectedCoins = 0;

    // 重置球的位置和速度
    x = canvas.width / 2;
    y = canvas.height - characterHeight - ballRadius - 20;
    dx = 3 * 0.7 * (Math.random() < 0.5 ? 1 : -1);
    dy = -3 * 0.7;

    // 重置角色的位置
    characterX = (canvas.width - characterWidth) / 2;

    // 重置角色圖片和大小
    characterImage.src = './images/character.png';
    characterWidth = characterOriginalWidth / 2.5;
    characterHeight = characterOriginalHeight / 2.5;

    // 重置所有磚塊的狀態
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            bricks[c][r].status = 1;
        }
    }

    // 清空硬幣陣列，重置角色圖片和效果
    coins = [];
    characterImage.src = './images/character.png';
    currentEffect = null;
    clearTimeout(effectTimeout); // 清除任何未完成的效果超時

    // 重置背景音樂
    startBackgroundMusic();

    // 設置遊戲狀態為開始並啟動遊戲循環
    gameStarted = true;
    timerInterval = setInterval(function () {
        timeElapsed += 0.01;
        drawScoreAndTime();
    }, 10);

    requestAnimationFrame(draw); // 開始遊戲循環
}

// 主遊戲循環繪製函數
function draw() {
    ctx.clearRect(0, roofHeight, canvas.width, canvas.height - roofHeight); // 清除遊戲區域畫面
    drawBackground(); // 繪製背景
    drawBricks(); // 繪製磚塊
    drawBall(); // 繪製球
    drawCoins(); // 繪製硬幣
    drawCharacter(); // 繪製角色
    drawScoreAndTime(); // 繪製分數和時間

    updateCoins(); // 更新硬幣狀態

    // 碰撞檢測
    if (collisionDetection()) {
        return; // 如果遊戲勝利，結束繪製
    }

    x += dx; // 更新球的水平位置
    y += dy; // 更新球的垂直位置

    // 檢查球是否撞到牆壁
    if (x + dx > canvas.width - ballRadius || x + dx < ballRadius) {
        dx = -dx; // 反轉水平方向
    }
    if (y + dy < ballRadius) {
        dy = -dy; // 反轉垂直方向
    } else if (y > canvas.height - characterHeight) {
        setTimeout(function () {
            gameOver(); // 顯示「得罪了！」並停止遊戲
        }, 100);
        return;
    } else if (y + dy > canvas.height - characterHeight - ballRadius) {
        // 擴大邊緣碰撞檢測範圍
        if (x > characterX - ballRadius && x < characterX + characterWidth + ballRadius) {
            let relativeX = x - characterX;
            let offset = relativeX / characterWidth - 0.5;
            dx = offset * 8; // 根據相對位置改變水平速度
            dy = -dy; // 反轉垂直方向
        }
    }

    if (y - ballRadius < roofHeight) {
        dy = -dy; // 撞到屋頂反彈
    }

    // 角色移動
    const characterSpeed = 7 * 0.6; // 將角色移動速度降至60%
    if (rightPressed && characterX < canvas.width - characterWidth) {
        characterX += characterSpeed; // 角色向右移動
    } else if (leftPressed && characterX > 0) {
        characterX -= characterSpeed; // 角色向左移動
    }

    requestAnimationFrame(draw); // 繼續遊戲循環
}

function gameOver() {
    stopBackgroundMusic(); // 停止背景音樂
    clearInterval(timerInterval); // 停止計時
    showMessage("得罪了！", false); // 顯示遊戲結束訊息
}

function gameWin() {
    stopBackgroundMusic(); // 停止背景音樂
    clearInterval(timerInterval); // 停止計時
    showMessage("主委加碼！", true); // 顯示遊戲勝利訊息
}
