/*
 Правила игры

 Происхождение игры в «Пьяницу» неизвестно. Есть мнение,
 что свое название она приобрела из-за простых правил и еще потому,
 что победа в игре зависит исключительно от везения. Играть в «Пьяницу» очень просто.
 На старте колода из 52 карт тасуется и делится между всеми игроками поровну.
 Далее каждый игрок кладет свою стопку карт перед собой «рубашкой» вверх.
 Игроки одновременно переворачивают верхнюю карту.
 Тот, у кого карта оказывается больше по достоинству, забирает все открытые карты себе и кладет их под свою стопку.
 Самой большой картой в «Пьянице» считается туз, самой маленькой — двойка.

 Если две карты оказываются одного достоинства, то начинается «война».
 Игроки кладут «рубашкой» вверх следующую карту, а следом за ней — карту лицом вверх.
 Игрок с большей картой забирает все карты на кону.
 Если карты снова оказываются равными, то «война» продолжается таким же образом.
 Снова одну карту кладут «рубашкой» вверх, а за ней — лицом вверх.
 И так далее до определения победителя. Выигравший «поединок» забирает все карты на кону.
 Игра продолжается, пока у одного игрока не окажутся все карты — он и считается победителем.
*/

function GameException(msg) {
    this.toString = function() {
        return msg;
    };
}

var Player = function(application, pid) {
    var id = pid;
    var cards = [];

    this.$cartHolder = null;
    this.$counter = null;

    /* положить карту на стол */
    this.putCard = function(shirt) {
        shirt = shirt || false;
        if(cards.length == 0) {
            throw new GameException('Player ' + id + ' has not cards.' );
        }
        var card = cards.pop();
        application.decreaseCounter(this);
        application.putPlayerCard(this, card, shirt);
        return card;
    };

    /* взять карту и положить в стопку */
    this.takeCard = function(card) {
        application.increaseCounter(this);
        return cards.unshift(card);
    };

    /* дать карту */
    this.giveCard = function(card) {
        cards.push(card);
    };

    this.leaveGame = function() {
        application.removePlayer(this);
    };

    this.getId = function() {
        return id;
    };

    this.getCards = function() {
        return cards;
    };

    this.toString = function() {
        return 'Player ' + id + ' with cards ' + cards;
    };
};

var Card = function(color, value) {
    var convertMatrix = {
        '♤': 's',
        '♧': 'c',
        '♡': 'h',
        '♢': 'd'
    };

    var priorityMatrix = {
        '2': 0, '3': 1, '4': 2, '5': 3, '6': 4, '7': 5, '8': 6, '9': 7, '10': 8, 'J': 9, 'Q': 10, 'K': 11, 'A': 12
    };

    this.color = color;
    this.value = value;

    this.toString = function() {
        return this.value + this.color;
    };

    this.toCssString = function() {
        return convertMatrix[this.color] + this.value;
    };

    function gt(v1, v2) {
        // TODO 2 > A
        return priorityMatrix[v1] > priorityMatrix[v2];
    }

    this.compare = function(operator, card) {
        switch(operator) {
            case ">":
                return gt(this.value,card.value);
            case ">=":
                return this.value == card.value || gt(this.value,card.value);
            case "==":
                return this.value == card.value;

            default: return false;
        }
    };
};

// draw
$(function() {
    (function() {
        return {
            init: function(options) {
                var module = this;
                module.options = $.extend(options);

                this.cache();
                this.preload(['img/1000px-Svg-cards-2.0.svg.png']);

                this.$start.click(function() {
                    if(module.game !== undefined) {
                        module.game.continueGame();
                    }
                    else {
                        module.startGame();
                    }

                    return false;
                });

                this.$stop.click(function() {
                    if(module.game !== undefined) {
                        module.game.stopGame();
                        delete module.game;
                    }
                    return false;
                });

                this.$pause.click(function() {
                    if(module.game !== undefined) {
                        module.game.pauseGame();
                    }
                    return false;
                });
            },

            cache: function() {
                this.$start = $('#start');
                this.$stop = $('#stop');
                this.$pause = $('#pause');
                this.$quantity = $('#quantity');
                this.$speed = $('#speed');
                this.$debug = $('#debug');
                this.$gameArea = $('#game-area');
                this.$gameTable = $('#game-table');
            },

            getQuantity: function() {
                return parseInt(this.$quantity.val());
            },

            getSpeed: function() {
                return parseInt(this.$speed.val());
            },

            isDebug: function() {
                return this.$debug.is(':checked');
            },

            startGame: function() {
                var module = this;

                var opts = {
                    quantity: module.getQuantity(),
                    speed: module.getSpeed(),
                    debug: module.isDebug()
                };

                this.game = new Game(module, opts);
            },

            createPlayers: function(players) {
                var module = this;

                var n = players.length;
                // размер игровой зоны
                var L = module.$gameArea.width() / 2;
                // радиус окружности на которую кладутся карты
                var R1 = 130;
                // радиус окружности на которую ставятся счетчики
                var R2 = L - 30;
                var step = 360 / n;

                // http://stackoverflow.com/questions/2345784/jquery-get-height-of-hidden-element-in-jquery
                var $fake_card = $('<div></div>').addClass('card').css({visibility: 'hidden'}).appendTo(module.$gameArea);
                var $fake_counter = $('<div></div>').addClass('game-counter').css({visibility: 'hidden'}).appendTo(module.$gameArea);

                console.log(L, $fake_card.width(), $fake_counter.width());

                players.forEach(function(player, i) {
                    var rot = step * i;
                    var x, y, sina, cosa;
                    sina = Math.sin(rot * Math.PI / 180);
                    cosa = Math.cos(rot * Math.PI / 180);
                    x = (sina * R1 + L - $fake_card.width() / 2).toFixed(2);
                    y = (cosa * R1 + L - $fake_card.height() / 2).toFixed(2);

                    player.$cartHolder = $('<div></div>')
                        .addClass('card')
                        .attr('id', 'card-holder-' + player.getId())
                        .css({top: y + 'px', left: x + 'px'})
                        .appendTo(module.$gameArea);

                    x = (sina * R2 + L - $fake_counter.width() / 2).toFixed(2);
                    y = (cosa * R2 + L - $fake_counter.width() / 2).toFixed(2);

                    player.$counter = $('<div></div>')
                        .addClass('game-counter')
                        .attr('id', 'counter-' + player.getId())
                        .css({top: y + 'px', left: x + 'px'})
                        .text(player.getCards().length)
                        .appendTo(module.$gameArea);
                });

                $fake_card.remove();
                $fake_counter.remove();
            },

            putPlayerCard: function(player, card, shirt) {
                player.$cartHolder
                    .removeClass()
                    .addClass('card')
                    .addClass(shirt ? 'shirt' : card.toCssString())
                ;
            },

            removePlayer: function(player) {
                player.$cartHolder.remove();
                player.$counter.remove();
            },

            increaseCounter: function(player) {
                player.$counter.text( parseInt(player.$counter.text()) + 1);
            },

            decreaseCounter: function(player) {
                player.$counter.text( parseInt(player.$counter.text()) - 1);
            },

            preload: function (arrayOfImages) {
                $(arrayOfImages).each(function(){
                    $('<img/>')[0].src = this;
                });
            }
        };
    })().init();
});

var Game = function(application, opts) {
    var context = this;

    var defaults = {
        quantity: 3,
        speed: 2500,
        debug: false
    };

    var options = $.extend(defaults, opts);

    if(options.quantity <= 0) {
        error(options.quantity);
        return;
    }

    // main loop
    var loop;
    var players = [];
    var deck = [];
    var TURN_NORMAL = 1, TURN_DISPUTE = 2;
    var turn_status = null;
    var dispute_cards = [];
    /*
     ♤, ♧, ♡, ♢
     spades, clubs, hearts, diamonds
     */
    ['♤', '♧', '♡', '♢'].forEach(function(color) {
        ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'].forEach(function(value) {
            deck.push(new Card(color, value));
        });
    });

    /**
     * Randomize array element order in-place.
     * Using Fisher-Yates shuffle algorithm.
     */
    function shuffleArray(array) {
        for (var i = array.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var temp = array[i];
            array[i] = array[j];
            array[j] = temp;
        }
        return array;
    }

    function startGame() {
        info('game started.');
        info(options);

        var shuffleDeck = shuffleArray(deck);

        for(var i = 0; i < options.quantity; i++) {
            players.push(new Player(application, i));
        }

        var pl_index = 0;
        shuffleDeck.forEach(function(card) {
            players[pl_index].giveCard(card);
            pl_index = pl_index === options.quantity - 1 ? 0 : pl_index + 1;
        });

        application.createPlayers(players);

        turn_status = TURN_NORMAL;
    }

    this.pauseGame = function() {
        clearInterval(loop);
    };

    this.stopGame = function() {
        context.pauseGame();
        players.forEach(function(player) {
            player.leaveGame();
        });
    };

    this.continueGame = function() {
        startLoop();
    };

    function startLoop() {
        loop = setInterval(gameTurn, options.speed);
    }

    function findBestCard(cards) {
        if(cards.length < 2) {
            throw new GameException('Not enought cards to get best.');
        }

        var max = [];
        var res = [];
        for (var i in cards) {
            if(!cards.hasOwnProperty(i)) { continue; }

            if(max.length == 0 || cards[i].compare('>', max[0])) {
                max = [cards[i]];
                res = [i];
            }
            else if(cards[i].compare('==', max[0])) {
                max.push(cards[i]);
                res.push(i);
            }
        }

        return res;
    }

    function printPlayers() {
        for(var i = 0; i < players.length; i++) {
            info(players[i]);
        }
    }

    function getPlayerById(id) {
        for(var i = 0; i < players.length; i++) {
            if(players[i].getId() == id) {
                return players[i];
            }
        }

        throw new GameException('Player ' + id + ' not found.' );
    }

    function log(msg) {
        !options.debug || console.log(msg);
    }

    function info(msg) {
        !options.debug || console.info(msg);
    }

    function error(msg) {
        !options.debug || console.error(msg);
    }

    // turn
    var gameTurn = function() {
        var cards = {};
        // TODO в случае спора играют тока спорящие игроки
        players.forEach(function(player) {
            cards[player.getId()] = player.putCard(turn_status == TURN_DISPUTE);
        });

        if(turn_status == TURN_NORMAL) {
            info('NORMAL TURN');
            info(cards);
            var bestCardN = findBestCard(cards);
            info('Best ' + bestCardN);
            if(bestCardN.length > 1) {
                turn_status = TURN_DISPUTE;

                for (var k in cards) {
                    if (cards.hasOwnProperty(k)) {
                        dispute_cards.push(cards[k]);
                    }
                }

            }
            else {
                turn_status = TURN_NORMAL;

                var player = getPlayerById(bestCardN[0]);
                var win_amount = 0;
                for (var k in cards) {
                    if (cards.hasOwnProperty(k)) {
                        player.takeCard(cards[k]);
                        win_amount++;
                    }
                }
                if(dispute_cards.length > 0) {
                    dispute_cards.forEach(function(card) {
                        player.takeCard(card);
                        win_amount++;
                    });
                    dispute_cards = [];
                }
                info('player ' + player.getId() + ' grab ' + win_amount + ' cards');
            }
        }
        else if(turn_status == TURN_DISPUTE) {
            info('DISPUTE TURN');

            for (var k in cards) {
                if (cards.hasOwnProperty(k)) {
                    dispute_cards.push(cards[k]);
                }
            }

            turn_status = TURN_NORMAL;
        }


        // проверим игроков на количество карт
        var leavers = [];
        players.forEach(function(player) {
            if(player.getCards().length === 0) {
                leavers.push(player);
            }
        });

        if(leavers.length > 0) {
            leavers.forEach(function(player) {
                players.splice(players.indexOf(player), 1);
                player.leaveGame();
                info('player ' + player.getId() + ' leave the game.');
            });
        }

        if(players.length == 1) {
            info('Player ' + players[0].getId() + ' win the game.');
            context.stopGame();
        }
    };

    // start game
    startGame();
    printPlayers();
    gameTurn(); // <-- first turn

    startLoop();
};

