dataAPIinit = function() {
    gapi.client.setApiKey('AIzaSyATrsvgpXDLv5S_HohztMyylIUnpLWpkqY');
    gapi.client.load('youtube', 'v3');
};

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
        className: 'ytloopform collection-item row'
    });

    var LoopView = Backbone.Marionette.ItemView.extend({
        template: '#loop-tpl',
        tagName: 'li',
        className: 'ytloop collection-item row valign-wrapper',
        events: {
            'mouseenter' : 'mouseOn',
            'mouseleave' : 'mouseOff',
            'click .start' : 'asgnStart',
            'click .end' : 'asgnEnd',
            'click .loop-action' : 'loopit'
        },
        mouseOn: function() {
            this.$el.toggleClass('z-depth-8');
            this.$el.find('.loop-action').removeClass('disabled').find('i')
            .animate({opacity: 0}, {
                duration: 200,
                step: function(now, fx) {
                    var a = (1-now)*360;
                    $(this).css('-webkit-transform','rotate('+a+'deg)');
                },
                done: function() {
                    $(this).addClass('mdi-navigation-refresh');
            }}).animate({opacity: 1}, {
                duration: 200,
                step: function(now, fx) {
                    var a = (now)*360;
                    $(this).css('-webkit-transform','rotate('+a+'deg)');
            }});
            this.$el.find('.start.time i').addClass('green-text');
            this.$el.find('.end.time i').addClass('red-text');
        },
        mouseOff: function() {
            this.$el.toggleClass('z-depth-8');
            this.$el.find('.loop-action').addClass('disabled').find('i')
            .animate({opacity: 0}, {
                duration: 200,
                step: function(now, fx) {
                    var a = (1-now)*360;
                    $(this).css('-webkit-transform','rotate('+a+'deg)');
                },
                done: function() {
                    $(this).removeClass('mdi-navigation-refresh');
            }}).animate({opacity: 1}, {
                duration: 200,
                step: function(now, fx) {
                    var a = (now)*360;
                    $(this).css('-webkit-transform','rotate('+a+'deg)');
            }});
            this.$el.find('.start.time i').removeClass('green-text');
            this.$el.find('.end.time i').removeClass('red-text');
        },
        asgnStart: function() {
            var time = App.ytloop.getVidTime();
            this.model.set({start:time});
            this.$el.find('span#start_value').fadeOut(400, function(){$(this).html(time).fadeIn()});
        },
        asgnEnd: function() {
            var time = App.ytloop.getVidTime();
            this.model.set({end:time});
            this.$el.find('span#end_value').fadeOut(400, function(){$(this).html(time).fadeIn()});
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
            ppButton: 'a#ctrl-pp',
            newButton: 'a#ctrl-add',
            videoName: '.video_name'
        },
        events: {
            'input @ui.urlInput' : 'inputURL',
            'click @ui.urlInput' : 'clearURL',
            'click @ui.ppButton' : 'ppVid',
            'click @ui.newButton' : 'newLoop',
            'keydown' : 'processKey',
            'mouseenter #main_header' : 'showURLform',
            'mouseleave #main_header' : 'hideURLform'

        },
        initialize: function() {
            this.render();

        },
        clearURL: function(e) {
            if(e){e.preventDefault()};
            this.ui.urlInput.val('').focus();
        },
        ppVid: function() {
            if (App.player) {
                var state = App.player.getPlayerState();
                if (state==1) {
                    this.pauseVid();
                } else {
                    this.playVid();
                };
            };
        },
        processKey: function(e) {
            if ($(':focus').length == 0) {
                if (e.keyCode == 32) {
                    e.preventDefault();
                    this.ui.ppButton.click();
                }
            }
        },
        showURLform: function() {
            var urlForm = this.ui.urlInput.closest('#url_form');
            if (!urlForm.is(':visible')) {
                this.ui.videoName.hide();
                urlForm.addClass('tempHover').show();
            }
        },
        hideURLform: function() {
            var urlForm = this.ui.urlInput.closest('#url_form');
            if (urlForm.hasClass('tempHover')) {
                this.ui.videoName.show();
                urlForm.removeClass('tempHover').hide();
            }
        },
        inputURL: function(e) {
            var input = this.ui.urlInput;
            var re = /(?:youtube).+(?:v=)([\w]+)/g;
            var ytid = re.exec(input.val());

            if (ytid) {
                $('iframe').detach();
                if (App.player) {delete App.player;};
                this.insertIframe(ytid[1]);
                input.blur();
                this.ui.urlInput.closest('#url_form').hide();
                this.appendVideoName(ytid);
            } else {
                alert('Not a proper youtube url');
            }

        },
        appendVideoName: function(id) {
            var that = this;
            var request = gapi.client.youtube.videos.list({
                'part' : 'snippet',
                'id' : id
            });
            request.then(function(response){that.ui.videoName.show();});
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
                this.clearURL();
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
        App.ytloop.ui.ppButton.find('i').clearQueue();
        if (state == 1) {
            App.ytloop.ui.ppButton.find('i')
            .animate({opacity:0}, {
                step: function(now, fx) {
                    var a = (1-now)*360;
                    $(this).css('-webkit-transform','rotate('+a+'deg)');
                },
                done: function() {
                    $(this).removeClass('mdi-av-play-arrow');
                }
            }).animate({opacity:1}, {
                step: function(now, fx) {
                    var a = (now)*360;
                    $(this).css('-webkit-transform','rotate('+a+'deg)');
                }
            });
        } else {
            if (state == 2) {
                App.ytloop.clearTimeout();
            };
            App.ytloop.ui.ppButton.find('i')
            .animate({opacity:0}, {
                step: function(now, fx) {
                    var a = (1-now)*360;
                    $(this).css('-webkit-transform','rotate('+a+'deg)');
                },
                done: function() {
                    $(this).addClass('mdi-av-play-arrow');
                }
            }).animate({opacity:1}, {
                step: function(now, fx) {
                    var a = (now)*360;
                    $(this).css('-webkit-transform','rotate('+a+'deg)');
                }
            });
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