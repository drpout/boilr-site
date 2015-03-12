 /*!
 * backgroundVideo v0.1.3
 * https://github.com/linnett/backgroundVideo
 * Use HTML5 video to create an effect like the CSS property, 'background-size: cover'. Includes parallax option.
 *
 * Copyright 2014 Sam Linnett
 * @license http://www.opensource.org/licenses/mit-license.html MIT License
 * @license http://www.gnu.org/licenses/gpl.html GPL2 License
 *
 */

;(function ( $, window, document, undefined ) {
    "use strict";

    // Create the defaults once
    var pluginName = "backgroundVideo",
        defaults = {
            $videoWrap: $('#video-wrap'),
            $outerWrap: $(window),
            $window: $(window),
            minimumVideoWidth: 400,
            preventContextMenu: false,
            parallax: true,
            parallaxOptions: {
                effect: 1.5
            },
            pauseVideoOnViewLoss: false
        };

    // The actual plugin constructor
    function Plugin( element, options ) {
        var me = this;
        this.element = element;
        this.options = $.extend( {}, defaults, options );

        this._defaults = defaults;
        this._name = pluginName;
        this.options.$video = $(element);

        this.detectBrowser();
        this.options.has3d = this.detect3d();

        // Set wrap default styles
        this.options.$videoWrap.css({
            'position': 'relative',
            'overflow': 'hidden',
            'z-index': '10'
        });
        // Set object default styles
        this.options.$video.css({
            'position': 'absolute',
            'z-index': '1'
        });

        this.options.$video.on('canplay canplaythrough', readyCallback);
        // If video is cached, the video will already be ready
        // so canplay/canplaythrough may not fire.
        if (this.options.$video[0].readyState > 3) {
            readyCallback();
        }

        function readyCallback() {
            me.options.originalVideoW = me.options.$video[0].videoWidth;
            me.options.originalVideoH = me.options.$video[0].videoHeight;
            if(me.initialised) {
                return;
            }
            me.init();
        }
    }

    Plugin.prototype = {

        init: function() {
            var me = this;

            this.initialised = true;

            // Run scaleObject function on window resize
            this.options.$window.resize(function() {
                me.positionObject(me.options.$video);
            });

            // Use Parallax effect on the object
            if(this.options.parallax) {
                // Set scroll listener for parallax effect
                this.options.$window.on('scroll.backgroundVideoParallax', function () {
                    me.positionObject(me.options.$video);
                });
            }

            // Pause video when the video goes out of the browser view
            if(this.options.pauseVideoOnViewLoss) {
                this.playPauseVideo();
            }

            // Prevent context menu on right click for object
            if(this.options.preventContextMenu) {
                this.options.$video.on('contextmenu', function() { return false; });
            }

            // Prompt resize to trigger listeners and set to browser size
            this.options.$window.trigger('resize');
        },

        detect3d: function () {
            var el = document.createElement('p'), t, has3d,
            transforms = {
                'WebkitTransform':'-webkit-transform',
                'OTransform':'-o-transform',
                'MSTransform':'-ms-transform',
                'MozTransform':'-moz-transform',
                'transform':'transform'
            };

            document.body.insertBefore(el, document.body.lastChild);

            for(t in transforms){
                if( el.style[t] !== undefined ){
                    el.style[t] = 'matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)';
                    has3d = window.getComputedStyle(el).getPropertyValue( transforms[t] );
                }
            }

            if( has3d !== undefined ){
                return has3d !== 'none';
            } else {
                return false;
            }
        },

        detectBrowser: function () {
            var val = navigator.userAgent.toLowerCase();

            if( val.indexOf('chrome') > -1 || val.indexOf('safari') > -1 ) {
                this.options.browser = 'webkit';
                this.options.browserPrexix = '-webkit-';
            }
            else if( val.indexOf('firefox') > -1 ) {
                this.options.browser = 'firefox';
                this.options.browserPrexix = '-moz-';
            }
            else if (val.indexOf('MSIE') !== -1 || val.indexOf('Trident/') > 0) {
                this.options.browser = 'ie';
                this.options.browserPrexix = '-ms-';
            }
            else if( val.indexOf('Opera') > -1 ) {
                this.options.browser = 'opera';
                this.options.browserPrexix = '-o-';
            }
        },

        scaleObject: function($video, $videoWrap) {
            var me = this, heightScale, widthScale, scaleFactor;

            // Set the video wrap to the outerWrap size (defaulted to window)
            $videoWrap.width(this.options.$outerWrap.width());
            $videoWrap.height(this.options.$outerWrap.height());

            heightScale = this.options.$window.width() / this.options.originalVideoW;
            widthScale = this.options.$window.height() / this.options.originalVideoH;

            scaleFactor = heightScale > widthScale ? heightScale : widthScale;

            if (scaleFactor * this.options.originalVideoW < this.options.minimumVideoWidth) {
                scaleFactor = this.options.minimumVideoWidth / this.options.originalVideoW;
            }

            // Scale object
            $video.width(scaleFactor * this.options.originalVideoW);
            $video.height(scaleFactor * this.options.originalVideoH);

            return {
                // Return x and y axis values for positioning
                xPos: -(parseInt($video.width() - this.options.$window.width()) / 2),
                yPos: parseInt($video.height() - this.options.$window.height()) / 2
            };

        },

        positionObject: function($video) {
            var me = this,
                scrollPos = this.options.$window.scrollTop(),
                scaleObject = this.scaleObject($video, me.options.$videoWrap),
                xPos = scaleObject.xPos,
                yPos = scaleObject.yPos;

            // Check for parallax
            if(this.options.parallax) {
                // Prevent parallax when scroll position is negative to the window
                if(scrollPos >= 0) {
                    yPos = this.calculateYPos(scrollPos);
                } else {
                    yPos = this.calculateYPos(0);
                }
            } else {
                yPos = -yPos;
            }

            // Check for 3dtransforms
            if(me.options.has3d) {
                $video.css(me.options.browserPrexix + 'transform3d', 'translate3d(-'+ xPos +'px, ' + yPos + 'px, 0)');
                $video.css('transform', 'translate3d('+ xPos +'px, ' + yPos + 'px, 0)');
            } else {
                $video.css(me.options.browserPrexix + 'transform', 'translate(-'+ xPos +'px, ' + yPos + 'px)');
                $video.css('transform', 'translate('+ xPos +'px, ' + yPos + 'px)');
            }
        },

        calculateYPos: function (scrollPos) {
            var videoPosition, videoOffset, yPos;

            videoPosition = parseInt(this.options.$videoWrap.offset().top);
            videoOffset = videoPosition - scrollPos;
            yPos = -(videoOffset / this.options.parallaxOptions.effect);

            return yPos;
        },

        disableParallax: function () {
            this.options.$window.unbind('.backgroundVideoParallax');
        },

        playPauseVideo: function () {
            var me = this;

            this.options.$window.on('scroll.backgroundVideoPlayPause', function () {
                // Play/Pause video depending on where the user is in the browser
                if(me.options.$window.scrollTop() < me.options.$videoWrap.height()) {
                    me.options.$video.get(0).play();
                } else {
                    me.options.$video.get(0).pause();
                }
            });
        }
    };

    // A really lightweight plugin wrapper around the constructor,
    // preventing against multiple instantiations
    $.fn[pluginName] = function ( options ) {
        return this.each(function () {
            if (!$.data(this, "plugin_" + pluginName)) {
                $.data(this, "plugin_" + pluginName,
                new Plugin( this, options ));
            }
        });
    };

})( jQuery, window, document );