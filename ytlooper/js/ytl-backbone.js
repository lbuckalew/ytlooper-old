$(document).ready(function() {
    App = new Backbone.Marionette.Application();

    var Loop = Backbone.Model.extend({
        defaults: {
            name: '',
            YTid : null,
            start: 0,
            end: 0
        }
    });

    var Loops = Backbone.Collection.extend({
        model: Loop
    });

    var EmptyLoopView = Backbone.Marionette.ItemView.extend({
        template: '#no-loops-tpl',
        tagName: 'li',
        className: 'ytloop collection-item row'
    });

    var LoopView = Backbone.Marionette.ItemView.extend({
        template: '#loop-tpl',
        tagName: 'li',
        className: 'ytloop collection-item row',
        events: {
            'mouseover' : 'mouseOn',
            'mouseout' : 'mouseOff',
            'click .start' : 'asgnStart',
            'click .end' : 'asgnEnd',
            'click .loop-action' : 'loopit'
        },
        mouseOn: function() {
            this.$el.toggleClass('z-depth-4');
            this.$el.find('.loop-action').removeClass('disabled').find('i').addClass('mdi-navigation-refresh');
            this.$el.find('.start.time i').addClass('green-text');
            this.$el.find('.end.time i').addClass('red-text');
        },
        mouseOff: function() {
            this.$el.toggleClass('z-depth-4');
            this.$el.find('.loop-action').addClass('disabled').find('i').removeClass('mdi-navigation-refresh');
            this.$el.find('.start.time i').removeClass('green-text');
            this.$el.find('.end.time i').removeClass('red-text');
        },
        asgnStart: function() {
            var time = App.ytloop.getVidTime();
            this.model.set({start:time});
            this.render();
        },
        asgnEnd: function() {
            var time = App.ytloop.getVidTime();
            this.model.set({end:time});
            this.render();
        },
        loopit: function() {
            var start = this.model.get('start');
            var end = this.model.get('end');

            if (end-start > 0.5) {
                App.ytloop.loopVid(start, end);
            } else {
                alert('End time comes before Start time.');
            };
        }
    });

    var LoopFormView = Backbone.Marionette.ItemView.extend({
        template: '#loop-form-tpl',
        tagName: 'li',
        className: 'ytloopform collection-item row',
        events: {
            'keypress' : 'newLoop'
        },
        newLoop: function(e) {
            if (e.keyCode === 13) {
                e.preventDefault();
                var name = this.$el.find('input#name').val();
                var loop = new Loop({name:name});
                App.ytloop.addLoop(loop);
                this.destroy();
            };
        }
    });

    var LoopListView = Backbone.Marionette.CollectionView.extend({
        childView: LoopView,
        emptyView: EmptyLoopView
    });

    var EmptyVideoView = Backbone.Marionette.ItemView.extend({
        template: '#no-vid-tpl'
    })

    var AppView = Backbone.Marionette.LayoutView.extend({
        template: false,
        el: 'body',
        regions: {
            loops: '#main #loops',
            video: '#main #video',
            loopList: '#user_loops'
        },
        ui: {
            urlInput: '#url_form input#url',
            playButton: 'a#ctrl-play',
            pauseButton: 'a#ctrl-pause',
            newButton: 'a#ctrl-add'
        },
        events: {
            'input @ui.urlInput' : 'inputURL',
            'click @ui.playButton' : 'playVid',
            'click @ui.pauseButton' : 'pauseVid',
            'click @ui.newButton' : 'newLoop',
            'keydown' : 'processKey'
        },
        initialize: function() {
            this.render();
            // this.ui.playButton.hide();
            // this.ui.pauseButton.hide();
        },
        processKey: function(e) {
            if ($(':focus').length == 0) {
                if (e.keyCode == 32) {
                    e.preventDefault();
                    this.ui.playButton.add(this.ui.pauseButton).find(':visible').click();
                }
            }
        },
        inputURL: function(e) {
            var input = this.ui.urlInput;
            var re = /(?:youtube).+(?:v=)([a-zA-Z0-9]+)/g;
            var ytid = re.exec(input.val());

            if (ytid) {
                this.insertIframe(ytid[1]);
                input.blur();
            } else {
                alert('Not a proper youtube url');
            }
        },
        insertIframe: function(ytid) {
            if ( YT ) {
                this.video.reset();
                $(this.video.el).append('<div id="player"></div>');
                var player = new YT.Player('player', {
                    height: '390',
                    width: '640',
                    videoId: ytid,
                    playerVars: {'showinfo' : 0, 'rel': 0, 'disablekb' : 1, 'autohide' : 1},
                    events: {'onReady' : 'onPlayerReady', 'onStateChange' : 'onPlayerStateChange'}
                });
                App.player = player;
                this.delegateEvents();
            };
        },
        playVid: function() {
            if (App.player) {
                App.player.playVideo();
            }
        },
        pauseVid: function() {
            if (App.player) {
                App.player.pauseVideo();
            }  
        },
        getVidTime: function() {
            if (App.player) {
                return parseFloat(App.player.getCurrentTime()).toFixed(2);
            }
        },
        setVidTime: function(time) {
            if (App.player) {
                App.player.seekTo(time, true);
            };
        },
        loopVid: function(start, end) {
            this.clearTimeout();
            var that = this;
            var delta = end-start;
            App.ytloop.setVidTime(start);
            App.ytloop.playVid();
            App.loopTimeout = setTimeout(function(){that.loopVid(start,end)}, delta*1000);
            console.log(App.loopTimeout)
        },
        newLoop: function() {
            this.$el.find('.ytloopform').detach();
            var v = new LoopFormView();
            var content = v.render().$el[0];
            App.ytloop.loopList.$el.prepend(content).find('input').focus();
        },
        addLoop: function(loop) {
            if (this.ui.urlInput.val()) {
                loop.set({YTid:this.ui.urlInput.val()});
                App.loops.add(loop);
            } else {
                alert('Need to enter a YouTube URL');
            }
        },
        clearTimeout: function() {
            clearTimeout(App.loopTimeout);
        }
    });

    onPlayerReady = function() {
        App.player.playVideo();
    };
    onPlayerStateChange = function() {
        var state = App.player.getPlayerState();
        if (state == 1) {
            App.ytloop.ui.playButton.hide();
            App.ytloop.ui.pauseButton.show();
        } else {
            if (state == 2) {
                App.ytloop.clearTimeout();
            };
            App.ytloop.ui.playButton.show();
            App.ytloop.ui.pauseButton.hide();
        };
    };

    App.on("start", function(options){
        App.ytloop = new AppView();
        App.ytloop.video.show(new EmptyVideoView());
        App.player = null;
        App.loops = new Loops();
        App.ytloop.loopList.show(new LoopListView({collection:App.loops}));
        if (Backbone.history){Backbone.history.start();};
    });

    App.start();
});