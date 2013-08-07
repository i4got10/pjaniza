var Player = function(application, pid) {
    var id = pid;
    var cards = [];

    this.$cartHolder = null;

    this.pushCard = function() {};

    /* положить карту на стол */
    this.putCard = function() {
        var card = cards.pop();
        application.putPlayerCard(this, card);
        return card;
    };

    /* взять карту */
    this.takeCard = function(card) {
        return cards.unshift(card);
    };

    /* дать карту */
    this.giveCard = function(card) {
        cards.push(card);
    };

    this.getId = function() {
        return id;
    };

    this.getCards = function() {
        return cards;
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

                this.$start.click(function() {
                    module.startGame(module.getQuantity());
                    return false;
                });

                this.$stop.click(function() {
                    if(module.game !== undefined) {
                        module.game.stopGame();
                    }
                    return false;
                });
            },

            cache: function() {
                this.$start = $('#start');
                this.$stop = $('#stop');
                this.$quantity = $('#quantity');
                this.$speed = $('#speed');
                this.$gameArea = $('#game-area');
                this.cardHolders = [];
            },

            getQuantity: function() {
                return parseInt(this.$quantity.val());
            },

            getSpeed: function() {
                return parseInt(this.$speed.val());
            },

            startGame: function() {
                var module = this;

                var opts = {
                    quantity: module.getQuantity(),
                    speed: module.getSpeed()
                };

                this.game = new Game(module, opts);
            },

            createCardHolders: function(players) {
                var module = this;

                // TODO clear module.cardHolders

                players.forEach(function(player, i) {
                    var n = players.length;
                    // размер игровой зоны
                    var L = module.$gameArea.width() / 2;
                    // радиус окружности на которую кладутся карты
                    var R = 130;
                    var step = 360 / n;

                    var $fake = $('<div></div>').addClass('card');

                    var a = step * i;
                    var x, y;
                    x = (Math.cos(a * Math.PI / 180) * R + L - $fake.width() / 2).toFixed(2);
                    y = (Math.sin(a * Math.PI / 180) * R + L - $fake.height() / 2).toFixed(2);
                    //console.info(i, a, x, y);

                    var $ch = $('<div></div>')
                        .addClass('card')
                        .attr('id', 'card-holder-' + player.getId())
                        .css({top: y + 'px', left: x + 'px'})
                        .appendTo(module.$gameArea);

                    player.$cartHolder = $ch;

                    module.cardHolders.push($ch);
                });
            },

            putPlayerCard: function(player, card) {
                player.$cartHolder
                    .removeClass()
                    .addClass('card')
                    .addClass(card.toCssString())
                ;
            }
        };
    })().init();
});

var Game = function(application, opts) {
    var defaults = {
        quantity: 3,
        speed: 2500
    };

    var options = $.extend(defaults, opts);

    if(options.quantity <= 0) {
        console.error(options.quantity);
        return;
    }

    function EmptyArrayException() {}

    var players = [];
    var deck = [];
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
        console.info('game started.');
        console.info(options);

        var shuffleDeck = shuffleArray(deck);

        for(var i = 0; i < options.quantity; i++) {
            players.push(new Player(application, i));
        }

        var pl_index = 0;
        shuffleDeck.forEach(function(card) {
            players[pl_index].giveCard(card);
            pl_index = pl_index === options.quantity - 1 ? 0 : pl_index + 1;
        });

        application.createCardHolders(players);
    }

    this.stopGame = function() {
        clearInterval(loop);
    };

    function findBestCard(cards) {
        if(cards.length < 2) {
            throw new EmptyArrayException;
        }

        var max = [cards[0]];
        var res = ["0"];
        for (i in cards) {
            if (i > 0 && cards.hasOwnProperty(i)) {
                if(cards[i].compare('>', max[0])) {
                    max = [cards[i]];
                    res = [i];
                }
                else if(cards[i].compare('==', max[0])) {
                    max.push(cards[i]);
                    res.push(i);
                }
            }
        }

        return res;
    }

    // turn
    var gameTurn = function() {
        var cards = {};
        players.forEach(function(player) {
            cards[player.getId()] = player.putCard();
        });

        var bestCardN = findBestCard(cards);
        console.info(bestCardN);
        if(bestCardN.length > 1) {

        }
        else {
            for (i in cards) {
                if (cards.hasOwnProperty(i)) {
                    // find by id TODO
                    players[bestCardN[0]].takeCard(cards[i]);
                }
            }
        }

        // проверим игроков на количество карт
        players.forEach(function(player, i) {
            if(player.getCards().length === 0) {
                var index = players.indexOf(i);
                players.splice(index, 1);

                application.createCardHolders(players);
            }
        });

        console.info('turn');
    };

    // start game
    startGame();
    gameTurn(); // <-- first turn

    // main loop
    var loop = setInterval(gameTurn, options.speed);
};

