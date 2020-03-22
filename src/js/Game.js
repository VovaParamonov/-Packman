import {
    Map,
    Cell,
    ConstructorCoin,
    ConstructorPlayer,
    ConstructorStone,
    ConstructorTrap
} from "./models";
import mapList from "./maps"
import controlSettings from "./controls";
import classDom from "./DOM";

const DOM = new classDom();

export class Graphic {
    constructor() {
        this.canvas = document.querySelector("#canvas");
        this.ctx = this.canvas.getContext("2d");
        this.windowWidth = this.canvas.clientWidth;
        this.windowHeight = this.canvas.clientHeight;
        this.cellSize = 40;
        this.drawBackground();
    }

    drawObject(object) {
        if (!object.visible) return;

        const width = object.spriteWidth;
        const height = object.spriteHeight;

        let posX = object.posX - this.cellSize /2;
        let posY = object.posY - this.cellSize /2;

        if (width && height) {
            posX = object.posX - width/ 2;
            posY = object.posY - height / 2;
        }

        if (object.spriteOffsetX) {
            posX += object.spriteOffsetX;
        }
        if (object.spriteOffsetY) {
            posY += object.spriteOffsetY;
        }

        try {
            this.ctx.drawImage(
                object.sprite, posX, posY,
                width || this.cellSize,
                height || this.cellSize
            );
        } catch (e) {
            console.log("Ошибка отрисовки объекта:", object)
        }

    };

    drawCell(cell) {
        if (cell.object) {
            if (cell.object.visible) {
                this.drawObject(cell.object)
            }
        }
    }

    drawBackground() {
        this.ctx.fillStyle = "black";
        this.ctx.fillRect(0, 0, this.windowWidth, this.windowHeight);
    }
}



class Game {
    constructor(gameData) {
        window.Game = this;

        if (!gameData) {

        } else {

        }

        this.eventList = [];
        this.Graphic = new Graphic();
        this.gameInterval = null;
        this.gameField = [];
        this.gameSpeed = 30;
        this.paused = false;
        this.gameTime = 0;
        this.gameTimer = null;

        this.stones = [];
        this.players = [];
        this.mobs = [];
        this.loot = [];
        this.traps = [];

        this.trapDuration = 40;

        this.mapList = mapList;

        this.allObjects = [...this.stones, ...this.players, ...this.mobs];

        this.mapCreate(this.mapList[0]);

        this.setControls();

        DOM.createInterface({ players: this.players });
    }

    addObject(object, type) {
        switch (type) {
            case "stone":
                this.stones.push(object);
                break;
            case "player":
                this.players.push(object);
                break;
            case "mobs":
                this.mobs.push(object);
                break;
            case "loot":
                this.loot.push(object);
                break;
            case "trap":
                this.traps.push(object);
                break;
            default:
                console.log("попытка добавления неизвестного типа объекта: " + type, object);
        }
        this.allObjects.push(object);
        // this.allObjects = [...this.stones, ...this.players, ...this.mobs, ...this.loot];
    }

    removeObject(deletedObject) {
        this.allObjects = this.allObjects.filter(object => object.id !== deletedObject.id);
        switch (deletedObject.type) {
            case "stone":
                this.stones = this.stones.filter(object => object.id !== deletedObject.id);
                this.stonePositionAnalyse();
                break;
            case "player":
                this.players = this.players.filter(object => object.id !== deletedObject.id);
                break;
            case "mob":
                this.mobs = this.mobs.filter(object => object.id !== deletedObject.id);
                break;
            case "loot":
                this.loot = this.loot.filter(object => object.id !== deletedObject.id);
                break;
            case "trap":
                this.traps = this.traps.filter(object => object.id !== deletedObject.id);
                break;
            default:
                this.loot = this.loot.filter(object => object.id !== deletedObject.id);
        }
    };

    setControls() {
        DOM.setControls(e => {
            // console.log(e.code);

            const controllerPlayer1 = controlSettings.player1;
            const controllerPlayer2 = controlSettings.player2;
            const controllerGlobal = controlSettings.global;

            if (!this.paused) {
                //Chose controlEvent
                switch (e.code) {
                    case controllerPlayer1.up:
                        this.players[0].control("up");
                        break;
                    case controllerPlayer1.right:
                        this.players[0].control("right");
                        break;
                    case controllerPlayer1.down:
                        this.players[0].control("down");
                        break;
                    case controllerPlayer1.left:
                        this.players[0].control("left");
                        break;
                    case controllerPlayer1.stop:
                        this.players[0].control("stop");
                        break;

                    case controllerPlayer2.up:
                        this.players[1].control("up");
                        break;
                    case controllerPlayer2.right:
                        this.players[1].control("right");
                        break;
                    case controllerPlayer2.down:
                        this.players[1].control("down");
                        break;
                    case controllerPlayer2.left:
                        this.players[1].control("left");
                        break;
                    case controllerPlayer2.stop:
                        this.players[1].control("stop");
                        break;
                }
            }

            if (e.code === controllerGlobal.pause) {
                if(this.paused) {
                    this.start();
                } else {
                    this.pause();
                }
                DOM.gamePause();
            }
        });
    }

    findCell(findData) {
        // console.log(findData);

        let posX;
        let posY;

        let allFields = [];

        let resultField;

        this.gameField.forEach(row => {
            row.forEach(field => allFields.push(field));
        });


        const halfCellSize = this.Graphic.cellSize / 2;

        if (findData.fieldPosRow && findData.fieldPosColumn) {
            resultField = allFields.find(field =>
                field.fieldPosRow === findData.fieldPosRow &&
                field.fieldPosColumn === findData.fieldPosColumn
            );
        } else {
            if (findData.posX && findData.posY) {
                posX = findData.posX;
                posY = findData.posY;

                resultField = allFields.find(field => {
                    return (
                        field.posX - halfCellSize <= posX &&
                        field.posX + halfCellSize >= posX &&
                        field.posY - halfCellSize <= posY &&
                        field.posY + halfCellSize >= posY
                    )
                });
            } else if (findData.object && findData.direction) {
                posX = findData.object.posX;
                posY = findData.object.posY;

                const baseField = allFields.find(field => {
                    return (
                        field.posX - halfCellSize <= posX &&
                        field.posX + halfCellSize >= posX &&
                        field.posY - halfCellSize <= posY &&
                        field.posY + halfCellSize >= posY
                    )
                });

                // console.log("baseField: ", baseField);
                if (baseField) {
                    switch (findData.direction) {
                        case "top":
                            resultField = this.findCell({
                                fieldPosRow: baseField.fieldPosRow - 1,
                                fieldPosColumn: baseField.fieldPosColumn
                            });
                            break;
                        case "right":
                            resultField = this.findCell({
                                fieldPosRow: baseField.fieldPosRow,
                                fieldPosColumn: baseField.fieldPosColumn + 1
                            });
                            break;
                        case "bottom":
                            resultField = this.findCell({
                                fieldPosRow: baseField.fieldPosRow + 1,
                                fieldPosColumn: baseField.fieldPosColumn
                            });
                            break;
                        case "left":
                            resultField = this.findCell({
                                fieldPosRow: baseField.fieldPosRow,
                                fieldPosColumn: baseField.fieldPosColumn - 1
                            });
                            break;
                    }
                } else {
                    return null;
                }

            }
        }

        return resultField;
    }

    stonePositionAnalyse() {
        const checkStoneField = function (i, j) {

            return (
                this.gameField[i] &&
                this.gameField[i][j] &&
                this.gameField[i][j].objects.length > 0 &&
                this.gameField[i][j].objects[0].type === "stone"
            );
        }.bind(this);

        this.gameField.forEach((row, i) => {
            row.forEach((field, j) => {
                if (field.objects.length > 0) {
                    // Detecting stone connections
                    if (field.objects[0].type === "stone") {
                        const stone = field.objects[0];
                        if (
                            true
                            // i > 0 && j > 0
                            // &&
                            // i < this.gameField.length - 1 && j < this.gameField[0].length - 1
                        ) {
                            if (
                                checkStoneField(i - 1, j) && checkStoneField(i + 1, j) &&
                                checkStoneField(i, j - 1) && checkStoneField(i, j + 1)
                            ) {
                                stone.setSprite("connectedAll");
                            } else if(
                                checkStoneField(i - 1, j) && checkStoneField(i + 1, j) &&
                                checkStoneField(i, j + 1)
                            ) {
                                stone.setSprite("betweenVerticalConnectedRight");
                            } else if(
                                checkStoneField(i - 1, j) && checkStoneField(i + 1, j) &&
                                checkStoneField(i, j - 1)
                            ) {
                                stone.setSprite("betweenVerticalConnectedLeft");
                            } else if(
                                checkStoneField(i, j - 1) && checkStoneField(i, j + 1) &&
                                checkStoneField(i + 1, j)
                            ) {
                                stone.setSprite("betweenHorizontalConnectedBottom");
                            } else if(
                                checkStoneField(i, j - 1) && checkStoneField(i, j + 1) &&
                                checkStoneField(i - 1, j)
                            ) {
                                stone.setSprite("betweenHorizontalConnectedTop");
                            } else if (checkStoneField(i + 1, j) && checkStoneField(i, j+1)) {
                                stone.setSprite("connectedBottomAndRight");
                            } else if (checkStoneField(i + 1, j) && checkStoneField(i, j-1)) {
                                stone.setSprite("connectedBottomAndLeft");
                            } else if (checkStoneField(i - 1, j) && checkStoneField(i, j+1)) {
                                stone.setSprite("connectedTopAndRight");
                            } else if (checkStoneField(i - 1, j) && checkStoneField(i, j-1)) {
                                stone.setSprite("connectedTopAndLeft");
                            } else if (checkStoneField(i, j + 1) && checkStoneField(i, j - 1)){
                                stone.setSprite("betweenHorizontal");
                            } else if (checkStoneField(i + 1, j) && checkStoneField(i - 1, j)) {
                                stone.setSprite("betweenVertical");
                            } else if (checkStoneField(i - 1, j)) {
                                stone.setSprite("connectedTop");
                            } else if (checkStoneField(i, j - 1)) {
                                stone.setSprite("connectedLeft");
                            } else if (checkStoneField(i + 1, j)) {
                                stone.setSprite("connectedBottom");
                            } else if (checkStoneField(i, j + 1)) {
                                stone.setSprite("connectedRight");
                            }
                        }
                    }
                }

            });
        })
    }

    addStone(i, j, stoneObject) {
        let newStone;
        if (stoneObject) {
            newStone = stoneObject;
        } else {
            newStone = new ConstructorStone(`${i}_${j}`);
        }

        this.addObject(newStone, "stone");
        this.gameField[i][j].set(newStone);
    }

    addStones(coordsList) {
        coordsList.forEach(coords => {
            const i = coords[0];
            const j = coords[1];

            const newStone =new ConstructorStone(`${i}_${j}`);

            this.addObject(newStone, "stone");
            this.gameField[i][j].set(newStone);
        })
    }

    mapCreate(map) {
        // Base map creating
        for (let i = 0; i < this.Graphic.windowHeight / this.Graphic.cellSize; i++) {
            this.gameField[i] = [];
            for (let j = 0; j < this.Graphic.windowWidth / this.Graphic.cellSize; j++) {

                this.gameField[i][j] = new Cell(
                    `${i}_${j}`,
                    j * this.Graphic.cellSize + this.Graphic.cellSize/2,
                    i * this.Graphic.cellSize + this.Graphic.cellSize/2,
                    i, j
                );

                if (
                    i === 0 || i === this.Graphic.windowHeight / this.Graphic.cellSize -1 ||
                    j === 0 || j === this.Graphic.windowWidth / this.Graphic.cellSize -1
                ) {
                    const newStone = new ConstructorStone(`${i}_${j}`);

                    if (i === 0 || i === this.Graphic.windowHeight / this.Graphic.cellSize -1) {
                        if (j > 0 && j < this.Graphic.windowWidth / this.Graphic.cellSize -1) {
                            newStone.setSprite("betweenHorizontal");
                            // newStone.spriteHeight = this.Graphic.cellSize + 12;
                            // newStone.spriteOffsetY = -6;
                        } else if (j === 0) {
                            if (i === 0) {
                                newStone.setSprite("connectedBottomAndRight");
                            }
                            else {
                                newStone.setSprite("connectedTopAndRight");
                            }
                        } else {
                            if (i === 0) {
                                newStone.setSprite("connectedBottomAndLeft");
                            }
                            else {
                                newStone.setSprite("connectedTopAndLeft");
                            }
                        }
                    } else {
                        newStone.setSprite("betweenVertical");
                    }

                    this.addObject(newStone, "stone");
                    this.gameField[i][j].set(newStone);
                }
            }
        }

        this.addStones(map.stoneList);

        map.holesInBaseStones.forEach(holesFieldCoords => {
            this.gameField[holesFieldCoords[0]][holesFieldCoords[1]].clear(true);
        });

        map.traps.forEach(trapFieldCoords => {
            const newTrap = new ConstructorTrap(`${trapFieldCoords[0]}_${trapFieldCoords[1]}`, null, null, this.trapDuration);

            this.addObject(newTrap, "trap");
            this.gameField[trapFieldCoords[0]][trapFieldCoords[1]].set(newTrap);
        });

        map.playersFieldCoords.forEach((fieldCoords, i) => {
            if (!this.players[i]) {
                this.addObject(new ConstructorPlayer(i, null, null, `player${i+1}`), "player");
                this.gameField[fieldCoords[0]][fieldCoords[1]].set(this.players[i]);
            }
        });

        //this.gameField[1][1].set(this.players[0]);


        // for (let j = 0; j < 5; j++) {
        //     this.addStone(2, 5 + j);
        // }

        // this.addStones();

        // Adding stones
        {
            // this.addStone(11, 10);
            // this.addStone(11, 10 - 1);
            // this.addStone(11, 10 + 1);
            // this.addStone(11 - 1, 10);
            // this.addStone(11 + 1, 10);
            //
            // this.addStone(10, 3);
            // this.addStone(11, 3);
            // this.addStone(10, 4);
            // this.addStone(10, 5);
            // this.addStone(11, 5);
            // this.addStone(12, 3);
            // this.addStone(12, 4);
            // this.addStone(12, 5);
            //
            // this.addStone(11, 15);

            this.stonePositionAnalyse();
        }

        this.gameField.forEach((row, i) => {
            row.forEach((field, j) => {
                if (field.objects.length === 0) {
                    const newCoin = new ConstructorCoin(`${i}_${j}`, field.posX, field.posY);

                    this.addObject(newCoin, "loot");
                    field.set(newCoin);
                }
            })
        });
    }

    drawFrame() {
        this.gameField.forEach(row => row.forEach(cell => {
            this.Graphic.drawObject(cell);
        }));

        this.allObjects = this.allObjects.sort((a,b) => a.posY - b.posY);

        this.traps.forEach(trap => this.Graphic.drawObject(trap));

        this.allObjects.forEach(object => {
            if (object.type !== "trap")
                this.Graphic.drawObject(object)
        });
    }

    checkOverflow() {
        const aliveObjects = [...this.mobs, ...this.players];

        aliveObjects.forEach(object => {
            if (object.posX > this.Graphic.windowWidth + this.Graphic.cellSize) {
                object.posX = 0 - this.Graphic.cellSize;
            } else if(object.posX < 0 - this.Graphic.cellSize) {
                object.posX = this.Graphic.windowWidth + this.Graphic.cellSize;
            } else if (object.posY > this.Graphic.windowHeight + this.Graphic.cellSize) {
                object.posY = 0 - this.Graphic.cellSize;
            } else if (object.posY < 0 - this.Graphic.cellSize) {
                object.posY = this.Graphic.windowHeight + this.Graphic.cellSize;
            }
        });
    }

    checkClash() {
        const aliveObjects = [...this.mobs, ...this.players];

        this.allObjects.forEach(object => {
            aliveObjects.forEach(aliveObject => {
                if (object.material && aliveObject.material) {
                    object.checkClash(aliveObject, this.Graphic.cellSize);
                }
            })
        })
    }

    getGameTime() {return this.gameTime}

    start() {
        this.paused = false;
        this.gameInterval = setInterval(() => {
            this.checkClash();

            this.eventList.forEach(event => event());
            this.eventList = [];

            this.allObjects.forEach(object=> {
                if (object.eventList) {
                    if (object.eventList.length > 0) object.startEvents();
                }
            });



            this.checkOverflow();

            this.drawFrame();

            DOM.interfaceReload({ players: this.players });


            // console.log('Время: ' + this.gameTime);
            // console.log(this.players);
            // this.players[0].die();
            // Временное!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
            // clearInterval(this.gameInterval);
        }, 1/this.gameSpeed*1000);

        this.gameTimer = setInterval(() => this.gameTime += 1, 1000);
    }

    pause() {
        this.paused = true;
        clearInterval(this.gameInterval);
        clearInterval(this.gameTimer);
    }
}

export default new Game();
