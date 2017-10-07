var config = {
    type: Phaser.WEBGL,
    parent: 'phaser-example',
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

var game = new Phaser.Game(config);

var scene = null;
var add = false;
var sub = 0;
var total = 0;
var random = Math.random;
var blitter;

function preload() {

    this.load.atlas('atlas', 'assets/atlas/megaset-0.png', 'assets/atlas/megaset-0.json');

}

function create() {

    scene = this;
    blitter = this.add.blitter(0, 0, 'atlas', 'chunk');

    for (var i = 0; i < 250; ++i)
    {
        blitter.create(random() * scene.game.config.width, random() * scene.game.config.height);
        total++;
    }

}

function update() {

    if (add)
    {
        for (var i = 0; i < 250; ++i)
        {
            blitter.create(random() * scene.game.config.width, random() * scene.game.config.height);
            total++;

            if (blitter.children.length === 2000)
            {
                //  Create a new blitter object, as they can only hold 10k bobs each
                console.log('Created new Blitter');
                blitter = this.add.blitter(0, 0, 'atlas', 'chunk');
            }
        }
    }

}

window.onmousedown = function ()
{
    add = true;
};

window.onmouseup = function ()
{
    add = false;
    console.log(total);
};
