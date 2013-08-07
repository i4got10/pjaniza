<?php

/**
 * @author: Alexey Belousov <forgottenbas@gmail.com>
 */

define('TAB', "\t");

$w = 77;
$h = 112;

foreach(array('s', 'c', 'h', 'd') as $kc => $color) {
    foreach(array('A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K') as $kv => $value) {
        echo sprintf('.card.%s%s', $color, $value) . ' {' . PHP_EOL;
        echo TAB . sprintf('background-position: %dpx %dpx', $kv * $w * -1  + ($kc > 0 ? 1 : 0), $kc * $h * -1) . PHP_EOL;
        echo '}' . PHP_EOL;
    }
}
