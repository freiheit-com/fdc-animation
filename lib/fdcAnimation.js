
/**
 * A small module for animating elements on a webpage (via requestAnimationFrame and frame interpolation).
 *
 * Frame interpolation means, that we don't rely on a perfect period for animation calls. Instead,
 * in each frame we calculate the animation value at the current time in the animation. Together
 * with requestAnimationFrame that enables very smooth animations (at the price that you can only animate
 * numeric values).
 *
 * See the example for a demo of this module.
 *
 * dependencies: _, $,
 *               requestAnimationFrame (i.e. via rAF.js polyfill)
 * authors: Michael Bohn (michael.bohn@freiheit.com)
 *          Friedrich Lenz (friedrich.lenz@freiheit.com)
 *          Fabian Loewner (fabian.loewner@freiheit.com)
 */
var fdcAnimation = (function() {
    "use strict";

    var module = {};
    module.version = "1.1";

    if(fdcAnimation && fdcAnimation.version === module.version) {
        return fdcAnimation;
    } else if(fdcAnimation && fdcAnimation.version !== module.version) {
        console.log("Multiple include of fdcAnimation, version mismatch. Already defined: " + fdcAnimation.version + " to be defined: " + module.version + " using version " + fdcAnimation.version);
        return fdcAnimation;
    }

    /**
     * This function requires a single object with the following properties:
     * def.propertyAccessor - a list (or single accessor) of propertyAccessors to animate.
     *       Each propertyAccesssor has to be a function that returns a property value if the functions
     *       is called with zero args and sets a value if it is called with one argument.
     *       Alternatively each propertyAccessor can also be a pair of accessor function and absolute end value.
     * def.endValueAbsolute - the target value that should be reached after animation finishes
     * def.duration (optional, default: 1 second) - duration of the animation (in milliseconds)
     * def.afterAnimation (optional, default: does nothing) - callback function that will be executed after the animation finished
     * def.timeTrafo (optional, default: identity function) - this function will be applied to the current frame time. Can be used
     *       implement non-linear animations.
     */
    module.animLinearPropNum = function(def) {
        var accessors;
        if(_.isArray(def.propertyAccessor)) {
            accessors=[];
            for (var i=0; i<def.propertyAccessor.length;i++) {
                if (_.isArray(def.propertyAccessor[i])) {
                    accessors[i]=def.propertyAccessor[i];
                } else {
                    accessors[i]=[def.propertyAccessor[i],def.endValueAbsolute];
                }
            }
        } else {
            accessors = [[def.propertyAccessor,def.endValueAbsolute]];
        }
        var dur = def.duration || 1000;
        var startAndEnd = _.map(accessors, function(acc) {return [parseFloat(acc[0]()),acc[1]];});
        var endfn = def.afterAnimation || function() {};

        // time transformation: default=linear
        var timeTrafo = def.timeTrafo || function(t){return t};

        var intervall = _.map(startAndEnd, function(s) {return s[1] - s[0]; });

        var startTime =  _.now();
        var endTime = startTime+dur;

        (function animation(){
            var frameTime = _.now();
            if(frameTime < endTime) {
                 requestAnimationFrame(animation);
                 _.each(startAndEnd, function(startAndEnd, i) {
                     accessors[i][0](startAndEnd[0] + ( intervall[i] * timeTrafo((frameTime - startTime) / dur)));
                 });
            } else {
                /* In the last frame we set the value to the target value.
                 * If we don't do that, we might miss the target value
                 * due to rounding errors or frame misses.
                 */
                var i;
                for(i=0;i<accessors.length; i++) {
                    accessors[i][0](accessors[i][1]);
                }
                endfn();
            }
        })();
    }

    /**
     * Creates a property accessor for a css property on a DOM element.
     */
    module.jqueryCssAccessor = function(elem, prop) {
        return function(newValue) {
            if( (typeof newValue) != "undefined" ) {
                $(elem).css(prop, newValue);
            } else {
               return $(elem).css(prop);
            }
        };
    }

    /**
     * A special case of animLinearPropNum: animates a numeric css value (uses
     * jquery for accessing the css property)
     */
    module.animLinearCssNum = function(def) {
        if(_.isArray(def.obj)) {
            def.propertyAccessor = _.map(def.obj, function(o) { return module.jqueryCssAccessor(o, def.property); });
        } else {
            def.propertyAccessor = module.jqueryCssAccessor(def.obj, def.property);
        }
        module.animLinearPropNum(def);
    };
    return module;
})();
