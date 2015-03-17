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

    var VideoData = Backbone.Model.extend({
        url: 'https://www.googleapis.com/youtube/v3/videos?part=snippet&key=AIzaSyATrsvgpXDLv5S_HohztMyylIUnpLWpkqY',
    });

    var Video = Backbone.Model.extend({
        defaults: {
            name: '',
            YTid : null
        }
    });
    var VideoView = Backbone.Marionette.ItemView.extend({
        template: '#user-video-list-item-tpl',
        tagName: 'li',
        className: 'user_video_list_item'
    });
    var Videos = Backbone.Collection.extend({
        model: Video
    })
    var VideosListView = Backbone.Marionette.CollectionView.extend({
        childView: VideoView,
        emptyView: EmptyVideoListView,
        onShow: function() {
            $('.dropdown-button').dropdown();
        }
    })
    var EmptyVideoListView = Backbone.Marionette.ItemView.extend({});

    var EmptyLoopView = Backbone.Marionette.ItemView.extend({
        template: '#no-loops-tpl',
        tagName: 'li',
        className: 'ytloopform collection-item row'
    });

    var LoopView = Backbone.Marionette.ItemView.extend({
        template: '#loop-tpl',
        tagName: 'li',
        className: 'ytloop collection-item row',
        events: {
            'mouseenter' : 'mouseOn',
            'mouseleave' : 'mouseOff',
            'click .start' : 'asgnStart',
            'click .end' : 'asgnEnd',
            'click .loop-action' : 'loopit'
        },
        onShow: function() {
            $('.tooltipped').tooltip({delay: 50});
            this.$el.find('.progress').hide() // hide by default
        },
        mouseOn: function() {
            this.$el.toggleClass('z-depth-8');

            if (!this.$el.hasClass('active-loop')) {
                //this.$el.find('.loop-action i').stop();
                this.$el.find('.loop-action').removeClass('disabled').find('i')
                .animate({opacity: 0}, {
                    queue: false,
                    duration: 200,
                    step: function(now, fx) {
                        var a = (1-now)*360;
                        $(this).css('-webkit-transform','rotate('+a+'deg)');
                    },
                    done: function() {
                        $(this).addClass('mdi-navigation-refresh');
                }}).animate({opacity: 1}, {
                    queue: false,
                    duration: 200,
                    step: function(now, fx) {
                        var a = (now)*360;
                        $(this).css('-webkit-transform','rotate('+a+'deg)');
                }});
            };
            this.$el.find('.start.time i').addClass('green-text');
            this.$el.find('.end.time i').addClass('red-text');
        },
        mouseOff: function() {
            this.$el.toggleClass('z-depth-8');

            if (!this.$el.hasClass('active-loop')) {
                //this.$el.find('.loop-action i').stop();
                this.$el.find('.loop-action').addClass('disabled').find('i')
                .animate({opacity: 0}, {
                    queue: false,
                    duration: 200,
                    step: function(now, fx) {
                        var a = (1-now)*360;
                        $(this).css('-webkit-transform','rotate('+a+'deg)');
                    },
                    done: function() {
                        $(this).removeClass('mdi-navigation-refresh');
                }}).animate({opacity: 1}, {
                    queue: false,
                    duration: 200,
                    step: function(now, fx) {
                        var a = (now)*360;
                        $(this).css('-webkit-transform','rotate('+a+'deg)');
                }});
            };
            this.$el.find('.start.time i').removeClass('green-text');
            this.$el.find('.end.time i').removeClass('red-text');
        },
        asgnStart: function() {
            var time = App.ytloop.getVidTime();
            this.model.set({start:time});
            this.$el.find('span#start_value').fadeOut(400, function(){$(this).html(time).fadeIn()});
            App.ytloop.saveLoops();
        },
        asgnEnd: function() {
            var time = App.ytloop.getVidTime();
            this.model.set({end:time});
            this.$el.find('span#end_value').fadeOut(400, function(){$(this).html(time).fadeIn()});
            App.ytloop.saveLoops();
        },
        loopit: function() {
            var start = this.model.get('start');
            var end = this.model.get('end');

            if (end-start > 0.5) {
                App.ytloop.loopVid(start, end);
                App.currentLoop = this;

                this.$el.siblings().removeClass('active-loop').find('a').addClass('disabled');
                this.$el.addClass('active-loop');
                this.$el.find('.progress').show()

                // monitor progress bar and save variable for later cancel
                App.progressInterval = setInterval(this.updateProgressBar, 100, this);
            } else {
                toast('End time comes before Start time.', 5000);
            };
        },
        updateProgressBar: function(context) {
            var start = context.model.get('start');
            var end = context.model.get('end');
            var range = end-start;
            var current = App.ytloop.getVidTime()
            var complete = Math.round(((current-start)/range)*100) + '%';
            context.$el.find('.progress .determinate').css('width',complete);
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
                var existing = App.loops.findWhere({name:name});

                if (existing) {
                    toast('There is already a loop with that name.', 5000);
                } else {
                    var loop = new Loop({name:name});
                    App.ytloop.addLoop(loop);
                    this.destroy();
                    App.ytloop.saveLoops();
                }
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
            loopList: '#user_loops',
            userVideoList: '#user_video_list'
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
            // clears the value fo the url input
            if(e){e.preventDefault()};
            this.ui.urlInput.val('').focus();
        },
        ppVid: function() {
            // pause or play the video (toggle)
            if (App.player) {
                var state = App.player.getPlayerState();
                if (state==1) {
                    this.pauseVid();
                } else {
                    this.playVid();
                };
            };
            clearInterval(App.progressInterval); // clear timing of active progress bar

            // unset any active loop
            App.ytloop.loopList.$el.find('.ytloop').removeClass('active-loop')
            .find('a').addClass('disabled').find('i').removeClass('mdi-navigation-refresh');
            this.$el.find('.progress').hide() // hide progress bar
        },
        processKey: function(e) {
            // route key commands
            // test if spacebar to toggle play / pause
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
            // take the url from the form and load all aspects of video
            var input = this.ui.urlInput;
            var re = /(?:youtube).+(?:v=)([\w]+)/g;
            var ytid = re.exec(input.val());

            if (ytid) {
                ytid = ytid[1];
                this.loadVideo(ytid);
            } else {
                toast('Not a proper youtube url', 5000);
            }

            App.ytloop.saveVideo();
        },
        loadVideo: function(ytid) {
            var that = this;

            App.video = new Video();
            App.video.set({YTid:ytid});

            // get from data api and save video info
            var videoData = new VideoData();
            videoData.url += '&id='+ytid;
            videoData.fetch({
                success: function(model, response, options) {
                    var n = response.items[0].snippet.title;
                    that.appendVideoName(n);
                    App.video.set({name:n});
                }
            });

            var input = this.ui.urlInput;
            input.blur();
            this.ui.urlInput.closest('#url_form').hide();
            this.ui.videoName.show();

            // get rid of current video 
            $('iframe').detach();
            if (App.player) {delete App.player;};

            //add new video
            this.insertIframe(ytid);
            toast('Video loaded. Press [spacebar] or the play button to begin.', 10000);
            toast('You can also drag the YouTube bar while paused for precision.', 10000);

            //show loops
            this.showLoops();

        },
        saveVideo: function() {
            var existing = App.userVideos.findWhere({YTid:App.video.get('YTid')});
            if (existing) {
                var msg = App.video.get('name') + ' is already in your video collection.';
                toast(msg, 5000);
            } else {
                App.userVideos.add(App.video);

                var c = JSON.stringify(App.userVideos.toJSON());
                document.cookie = "userVideos=" + c;


                var msg = App.video.get('name') + ' added to your video collection.';
                toast(msg, 5000);
            };
        },
        showLoops: function() {
            // show all loops related to current video
            var loops = App.userLoops.where({YTid:App.video.get('YTid')});
            App.loops.reset(loops);
        },
        saveLoops: function() {
            // saves all loops in userLoops
            var YTid = App.video.get('YTid');
            var oldLoops = App.userLoops.filter(function(model){return !(model.get('YTid')==YTid)});
            var newLoops = App.ytloop.loopList.currentView.collection.models;
            _.each(newLoops, function(loop) {
                oldLoops.push(loop);
            });
            document.cookie = "userLoops=" + JSON.stringify(oldLoops);
            toast('New loops were saved', 5000);
        },
        appendVideoName: function(title) {
            this.ui.videoName.html("Loopin' " + title);
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
            if (App.video) {
                loop.set({YTid:App.video.get('YTid')});
                App.loops.add(loop);
                var msg = 'Loop added to ' + App.video.get('name');
                toast(msg, 5000);
            } else {
                this.clearURL();
                toast('Need to enter a YouTube URL', 5000);
            }
        },
        clearTimeout: function() {
            clearTimeout(App.loopTimeout);
        }
    });

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
                    $(this).removeClass('mdi-av-play-arrow').addClass('mdi-av-pause');
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
                    $(this).removeClass('mdi-av-pause').addClass('mdi-av-play-arrow');
                }
            }).animate({opacity:1}, {
                step: function(now, fx) {
                    var a = (now)*360;
                    $(this).css('-webkit-transform','rotate('+a+'deg)');
                }
            });
        };
    };
    function getCookie(name) {
        var re = new RegExp(name + "=([^;]+)");
        var value = re.exec(document.cookie);
        return (value != null) ? unescape(value[1]) : null;
    };

    var AppRouter = Backbone.Router.extend({

        routes: {
            'loop/:ytid' : 'loop'
        },
        loop: function(ytid) {
            var that = this;

            if (!YT.loaded) {
                App.loadErrors++;

                if (App.loadErrors<3) {
                    toast('Attempting to load video.', 3000);
                    setTimeout(this.loop, 3500, ytid);
                } else if (App.loadErrors<5) {
                    toast('Having trouble loading video...', 3000);
                    setTimeout(this.loop, 3500, ytid);
                } else if (App.loadErrors==5) {
                    toast('Cannot load, try another video :(', 3000);
                }

            } else {
                App.loadErrors = 0; //re-init
                App.ytloop.loadVideo(ytid);
            }
        }
    });

    App.on("start", function(options){

        App.loadErrors = 0;
        App.ytloop = new AppView();
        App.ytloop.video.show(new EmptyVideoView());

        App.player = null;

        App.loops = new Loops();
        App.ytloop.loopList.show(new LoopListView({collection:App.loops}));

        var vidCookie = JSON.parse(getCookie('userVideos'));
        App.userVideos = new Videos(vidCookie);
        App.ytloop.userVideoList.show(new VideosListView({collection:App.userVideos}));

        var loopCookie = JSON.parse(getCookie('userLoops'));
        App.userLoops = new Loops(loopCookie);

        new AppRouter();
        if (Backbone.history){Backbone.history.start();};
    });

    App.start();

});