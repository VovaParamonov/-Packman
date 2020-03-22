import heartSrc from "../images/interface/heart.png"

export default class ClassDOM {
    constructor() {
        this.$gameWindow = document.querySelector(".canvasWrapper");
        this.$interface = document.querySelector(".live_interface");
        this.$playerInfoBlocks = [];

    }

    gamePause() {
        this.$gameWindow.classList.toggle("pause");
    }

    touchHandler(e) {
        console.log(e);
    }

    setControls(controller) {
        document.addEventListener("keydown", e => controller(e));

        // document.addEventListener("touchstart", this.touchHandler, false);
        // document.addEventListener("touchend", this.touchHandler, false);
        // document.addEventListener("touchcancel", this.touchHandler, false);
        // document.addEventListener("touchmove", this.touchHandler, false);
    }

    createInterface(data) {
        data.players.forEach((player, i) => {
            const $playerInfo = document.createElement("div");
            const $playerInfo__score = document.createElement("span");
            // const $playerInfo__rebornCounter = document.createElement("span");
            const $playerInfo__pictureWrapper = document.createElement("div");
            const $playerPicture = new Image();
            const $playerInfo__picture_progressBar = document.createElement("div");
            const $playerInfo__playerData = document.createElement("div");
            const $playerInfo__nickname = document.createElement("span");
            const $playerInfo__heaths = document.createElement("div");




            $playerInfo.className = `player_info player_info--${player.id}`;

            $playerInfo__pictureWrapper.className = `player_info__avatar_wrapper`;
            $playerPicture.src = player.sprite.src;
            $playerPicture.className = `player_info__avatar`;
            $playerInfo__picture_progressBar.className = `player_info__avatar_progress_bar`;

            $playerInfo__pictureWrapper.append($playerInfo__picture_progressBar);
            $playerInfo__pictureWrapper.append($playerPicture);

            $playerInfo__playerData.className = `player_info__player_data`;
            $playerInfo__nickname.textContent = player.nickName;
            $playerInfo__nickname.className = `player_data__nickname`;
            $playerInfo__heaths.className = `player_data__heaths`;
            $playerInfo__score.className =`player_info__score`;
            $playerInfo__score.innerHTML = `$<span class='score_value'>${player.score}</span>`;

            for (let i = 0; i < player.hp; i++) {
                const $playerHeathImg = new Image();
                $playerHeathImg.src = heartSrc;
                $playerHeathImg.className = "heath";
                $playerInfo__heaths.append($playerHeathImg);
            }
            $playerInfo__playerData.append($playerInfo__nickname);
            $playerInfo__playerData.append($playerInfo__heaths);
            $playerInfo__playerData.append($playerInfo__score);


            // $playerInfo__rebornCounter.className = `player_info__reborn_counter`;
            // $playerInfo__rebornCounter.innerHTML = `Возродится через: <span class='reborn_counter__counter'>${player.rebornCounter}</span>`;


            $playerInfo.append($playerInfo__pictureWrapper);
            $playerInfo.append($playerInfo__playerData);
            // $playerInfo.append($playerInfo__rebornCounter);

            this.$interface.append($playerInfo);

            this.$playerInfoBlocks.push($playerInfo);

        })

    }

    interfaceReload(data) {
        data.players.forEach((player) => {
            const $playerInfoBlock = this.$playerInfoBlocks.find($block => $block.classList.contains(`player_info--${player.id}`));
            const $scoreValue = $playerInfoBlock.querySelector(".score_value");
            // const $rebornCounterWrapper = $playerInfoBlock.querySelector(".player_info__reborn_counter");
            // const $rebornCounter = $rebornCounterWrapper.querySelector(".reborn_counter__counter");
            const $playerInfo__picture_progressBar = $playerInfoBlock.querySelector(".player_info__avatar_progress_bar");


            $scoreValue.textContent = player.score;

            if ($playerInfoBlock.getElementsByClassName("heath").length !== player.hp) {
                const $playerInfo__heaths = $playerInfoBlock.querySelector(".player_data__heaths");

                $playerInfo__heaths.innerHTML = "";

                for (let i = 0; i < player.hp; i++) {
                    const $playerHeathImg = new Image();
                    $playerHeathImg.src = heartSrc;
                    $playerHeathImg.className = "heath";
                    $playerInfo__heaths.append($playerHeathImg);
                }
            }


            // reborn progressBar
            {
                if (player.killed) {
                    if (!$playerInfo__picture_progressBar.classList.contains("active")) {
                        $playerInfo__picture_progressBar.classList.add("active");
                        $playerInfo__picture_progressBar.style = "width: 100%";
                    }
                } else {
                    if ($playerInfo__picture_progressBar.classList.contains("active")) {
                        setTimeout(() => {
                            $playerInfo__picture_progressBar.classList.remove("active");
                        }, 500);
                    }
                }
                if (player.hp > 0) {
                    if (player.rebornCounter > 0) {
                        const progressPercent = player.rebornCounter / player.rebornTime * 100;
                        $playerInfo__picture_progressBar.style = `width: ${progressPercent}%`;

                        // $rebornCounter.textContent = player.rebornCounter;
                    } else {
                        // $rebornCounter.textContent = 0;
                        $playerInfo__picture_progressBar.style = "width: 0";
                    }
                }
            }

        })
    }
}

