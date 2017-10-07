var config = {
    type: Phaser.WEBGL,
    parent: 'phaser-example',
    width: 800,
    height: 600,
    scene: {
        preload: preload,
        create: create
    }
};

var game = new Phaser.Game(config);

function preload ()
{
    this.load.image('gem', 'assets/sprites/gem.png');
}

function create ()
{
    var text = this.add.text(350, 250, '', { font: '16px Courier', fill: '#00ff00' });

    var gem = this.add.image(300, 300, 'gem');

    //  Store some data about this Gem:

    gem.data.set('name', 'Red Gem Stone');
    gem.data.set('level', 2);
    gem.data.set('owner', 'Link');

    //  Whenever the 'gold' property is updated we call this function:
    gem.data.after('gold', function (gameObject, key, value) {

        text.setText([
            'Name: ' + gem.data.get('name'),
            'Level: ' + gem.data.get('level'),
            'Value: ' + gem.data.get('gold') + ' gold',
            'Owner: ' + gem.data.get('owner')
        ]);

    });

    //  Set the value, this will call the 'after' callback
    gem.data.set('gold', 50);

    //  Change the 'value' property when the mouse is clicked

    this.input.events.on('POINTER_DOWN_EVENT', function () {

        var gold = gem.data.get('gold');

        //  Set the value, this will call the 'after' callback
        gem.data.set('gold', gold + 50);

    });
}
