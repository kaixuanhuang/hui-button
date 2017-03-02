define('hui/validatable/base-validator',[
    'object-utils/classes',
    'register-component/v2/UIComponent'
], function(classes, UIComponent) {
    'use strict';

    var BaseValidator = classes.createObject(UIComponent, {
        /**
         * Override this in each validator to define a default message
         */
        init: function(validationType, options) {
            this.options = options;
            // needed so later we can query them if invalidMessage or requiredMessage is updated
            this.validationType = validationType;
            this.element = options.element;
            this.onInit();
        },

        test: function() {
            return false;
        },

        onInit: function() {

        },

        getValue: function() {
            return this.element.value;
        },

        matchToValue: function(regex) {
            var re = new RegExp(regex);
            return re.test(this.getValue());
        }
    });

    return BaseValidator;
});


define('hui/validatable/validators/required',[
    '../base-validator',
    'object-utils/classes'
], function(BaseValidator, classes) {
    'use strict';
    var RequiredValidator = classes.createObject(BaseValidator, {
        test: function() {
            var value = this.getValue();
            if (Array.isArray(value)) {
                return value.length > 0;
            } else {
                return !!value;
            }
        }
    });
    return RequiredValidator;
});

define('hui/validatable/validators/numeric',[
    '../base-validator',
    'object-utils/classes'
], function(BaseValidator, classes) {
    'use strict';

    var NumericValidator = classes.createObject(BaseValidator, {
        test: function() {
            return this.matchToValue('^[0-9]+$');
        }
    });

    return NumericValidator;
});
define('hui/validatable/validators/pattern',[
    '../base-validator',
    'object-utils/classes'
], function(BaseValidator, classes) {
    'use strict';

    var PatternValidator = classes.createObject(BaseValidator, {
        test: function() {
            return this.matchToValue(this.options.pattern);
        }
    });

    return PatternValidator;
});
define('hui/validatable/validators/function',[
    '../base-validator',
    'object-utils/classes'
], function(BaseValidator, classes) {
    'use strict';

    var FunctionValidator = classes.createObject(BaseValidator, {
        test: function() {
            return this.options.validatorFunc.call();
        }
    });

    return FunctionValidator;
});
define('hui/validatable/validators/min',[
    '../base-validator',
    'object-utils/classes'
], function(BaseValidator, classes) {
    'use strict';

    var MinValidator = classes.createObject(BaseValidator, {
        test: function() {
            return parseFloat(this.getValue()) >= this.options.minVal;
        }
    });

    return MinValidator;
});
define('hui/validatable/validators/max',[
    '../base-validator',
    'object-utils/classes'
], function(BaseValidator, classes) {
    'use strict';

    var MaxValidator = classes.createObject(BaseValidator, {
        test: function() {
            return parseFloat(this.getValue()) <= this.options.maxVal;
        }
    });

    return MaxValidator;
});
define('hui/validatable/validators/expected',[
    '../base-validator',
    'object-utils/classes'
], function(BaseValidator, classes) {
    'use strict';

    var expectedValueValidator = classes.createObject(BaseValidator, {
        test: function() {
            return this.getValue() === this.options.expectedValue;
        }
    });

    return expectedValueValidator;
});
define('hui/validatable/validators/min-required',[
    '../base-validator',
    'object-utils/classes'
], function(BaseValidator, classes) {
    'use strict';

    var minRequiredValidator = classes.createObject(BaseValidator, {
        test: function() {
            return this.element.value.length >= this.options.minRequired;
        }
    });

    return minRequiredValidator;
});


define('hui/core/Viewport',[],function() {
    'use strict';
    /**
     * Detects if it's a mobile browser
     * @return {Boolean} true if it's a mobile browser
     */
    function _isMobile() {
        return /iPhone|iPod|iPad|Android|BlackBerry/.test(navigator.userAgent);
    }

    /**
     * Attaches or deattaches a callback from the resize change event
     * @param  {String}     actionType   determines whether to use addEventListener or removeEventListener
     * @param  {Function}   callback the handler to be attached
     */
    function _handleResizeHandlerAttachment(actionType, callback) {
        var focusableElements = ['input', 'select', 'textarea'],
            body = document.getElementsByTagName('body')[0],
            action = actionType === 'add' ? HTMLElement.prototype.addEventListener : HTMLElement.prototype.removeEventListener,
            safeWindowsAction = actionType === 'add' ? window.addEventListener : window.removeEventListener,
            delegatedCallback = function(event) {
                var targetType = event.target.nodeName.toLowerCase();
                if (focusableElements.indexOf(targetType) > -1) {
                    callback();
                }
            };

        if (_isMobile()) {
            action.call(body, 'focusin', delegatedCallback, false);
            action.call(body, 'focusout', delegatedCallback, false);
            action.call(document, 'orientationchange', callback, false);
        } else {
            safeWindowsAction.call(window, 'resize', callback, false);
        }
    }

    /**
     * Utility set of methods to handle the viewport properties.
     * @type {Object}
     */
    var viewport = {

        /**
        * Adds a handler to the viewport size change event, considering
        * also problematic cases in mobile devices
        * @callback  callback
        */
        onResize: function(callback) {
            _handleResizeHandlerAttachment('add', callback);
        },

        /**
        * Removes a handler off the viewport size change event
        * @callback  callback   the handler to be removed
        */
        offResize: function(callback) {
            _handleResizeHandlerAttachment('remove', callback);
        }

    };

    return viewport;
});
define('hui/core/popup',[
    './Viewport'
],
function(Viewport) {

    var BASE_MARGIN = 5,
        CONNECTOR_MARGIN = 4,
        VERTICAL_POSITIONS = ['top', 'bottom'],
        HORIZONTAL_POSITIONS = ['left', 'right'],
        VERTICAL_ALIGNMENTS = ['top', 'middle', 'bottom'],
        HORIZONTAL_ALIGNMENTS = ['left', 'center', 'right'];

    /**
     * Makes calculations for box-shadow sizes
     * @param  {HTMLElmenet} element Element source for box-shadow sizes
     * @return {object} object.top {Number}
     *                  object.bottom {Number}
     *                  object.left {Number}
     *                  object.right {Number}
     */
    function getBoxShadowSize(element) {
        var style = window.getComputedStyle(element),
            shadowSize,
            shadowSizeArray,
            hShadow,
            vShadow,
            spread,
            blur,
            result = {
                left: 0,
                right: 0,
                top: 0,
                bottom: 0
            };

        shadowSize = style.getPropertyValue('box-shadow');
        if (shadowSize === 'none') {
            return result;
        }

        // Remove all possible color definitions
        shadowSize = shadowSize.replace(/rgba?\([^\)]+\)/gi, '');
        shadowSize = shadowSize.replace(/#[0-9a-f]+/gi, '');

        // Remove any alpha characters
        shadowSize = shadowSize.replace(/[a-z]+/gi, '').trim();

        shadowSizeArray = shadowSize.split(' ');

        hShadow = +shadowSizeArray[0];
        vShadow = +shadowSizeArray[1];
        blur = +shadowSizeArray[2];
        spread = +shadowSizeArray[3];

        result.left = Math.max(spread - hShadow + 0.5 * blur, 0);
        result.right = Math.max(spread + hShadow + 0.5 * blur, 0);
        result.top = Math.max(spread - vShadow + 0.5 * blur, 0);
        result.bottom = Math.max(spread + vShadow + 0.5 * blur, 0);

        return result;

    }

    /**
     * Some math to retrieve the current position of the target element.
     * @param {HTMLElement} elem The element to get the position.
     *
     * @return {Object} object.x {Number}
     *                  object.y {Number}
     */
    function _getAbsolutePosition(elem) {
        var x = 0,
            y = 0;
        // offset is relative to parent so,
        // we traverse all the tree up until
        // target has no more parents.
        do {
            if (elem) {
                x += parseInt(elem.offsetTop, 10);
                y += parseInt(elem.offsetLeft, 10);
                elem = elem.offsetParent;
            }
        } while (elem && !_generatesNewStackingContext(elem));
        return {
            x: x,
            y: y
        };
    }

    /**
     * Determines if the element is in a stacked context.
     * @param {HTMLElement} elem Element source to check stacked context
     * @returns {boolean}
     * @private
     */
    function _generatesNewStackingContext(elem) {
        var styles = elem ? window.getComputedStyle(elem) : null,
            pos;
        if (styles) {
            pos = styles.position;
            if (pos === 'absolute' || pos === 'relative') {
                return true;
            }
        }
        return false;
    }

    /**
     * Determines if the element has non-zero offsetWidth and offsetHeight.
     * @param  {HTMLElement} elem Element to detect width and height
     * @return {Boolean}      True if the element has non-zero width and height
     */
    function _hasDimension(elem) {
        return (elem.offsetWidth > 0) && (elem.offsetHeight > 0);
    }

    /**
     * Retrieves the dimensions of the object.
     *
     * @param {HTMLElement} elem The element which we want to get the dimension.
     *
     * @return {Object} object.width {Number}
     *                  object.height {Number}
     */
    function _getDimension(elem) {
        var dimensions = {},
            style = {
                'position': '',
                'display': '',
                'top': '',
                'left': ''
            },
            moved = false,
            domRect,
            rect = {},
            key = '';

        // If we have dimensions we can just use it.
        if (!_hasDimension(elem)) {
            domRect = elem.getBoundingClientRect();

            if (!domRect.width || !domRect.height) {

                // If we don't have dimensions we need to put the elem in a state
                // that we can truly get the width and height and then restore
                // everything.
                moved = true;
                for (key in style) {
                    style[key] = elem.style[key] || '';
                }

                // @TODO Maybe a better strategy here. The main issue with this
                // is performance.
                elem.style.position = 'absolute';
                elem.style.left = '-1000px';
                elem.style.top = '-1000px';
                elem.style.display = 'inline-block';
            } else {
                rect.width = domRect.width;
                rect.height = domRect.height;
            }
        }
        dimensions = {
            width: rect.width || elem.offsetWidth,
            height: rect.height || elem.offsetHeight
        };

        if (moved) {
            for (key in style) {
                elem.style[key] = style[key];
            }
        }

        return dimensions;
    }

    /**
     * Retrieve the position and the dimensions of an element.
     *
     * @return {object} object.left {Number}
     *                  object.top {Number}
     *                  object.right {Number}
     *                  object.bottom {Number}
     *                  object.width {Number}
     *                  object.height {Number}
     */
    function _getRect(elem) {
        var rect = {},
            position = _getAbsolutePosition(elem),
            dimension = _getDimension(elem);
        rect.left = position.y;
        rect.right = position.y + dimension.width;
        rect.top = position.x;
        rect.bottom = position.x + dimension.height;
        rect.width = dimension.width;
        rect.height = dimension.height;

        return rect;
    }

    /**
     * Math to determine if the top position is available.
     * @param {object} targetRect            position and dimensions of the parent object.
     * @param {object} childRect             position and dimensions of the child object.
     * @param {Number} margin                margin between the popup and the target
     * @param {Object} boxShadow             calculated size of box-shadow property of child
     * @param {object} currentPosition       current calculations for positioning the popup
     * @param {object} currentPositionType   current type of position or alignment
     *
     * @return {object} result
     */
    function _tryTopPosition(targetRect, childRect, margin, boxShadow, currentPosition, currentPositionType) {
        var available = targetRect.top,
            finalMargin = margin + boxShadow.bottom,
            needed = childRect.height + finalMargin;

        if (needed < available) {
            currentPositionType.position = 'top';
            currentPosition.x = targetRect.top - needed;
        }
    }

    /**
     * Math to determine if the bottom position is available.
     *
     * @param {object}   targetRect          position and dimensions of the parent object.
     * @param {object}   childRect           position and dimensions of the child object.
     * @param {Number}   margin              margin between the popup and the target
     * @param {Object}   boxShadow           calculated size of box-shadow property of child
     * @param {object}   currentPosition     current calculations for positioning the popup
     * @param {object}   currentPositionType current type of position or alignment
     * @param {Boolean}  force               when set on true, forces the positioning (used as fallback)
     *
     * @return {object} result
     */
    function _tryBottomPosition(targetRect, childRect, margin, boxShadow, currentPosition, currentPositionType, force) {
        var finalMargin = margin + boxShadow.top,
            available = _getPageSize(this.ownerDocument).height - targetRect.bottom,
            needed = childRect.height + finalMargin;

        if ((needed < available) || force) {
            currentPositionType.position = 'bottom';
            currentPosition.x = targetRect.bottom + finalMargin;
        }
    }

    /**
     * Math to determine if the right position is available.
     *
     * @param {object} targetRect            position and dimensions of the parent object.
     * @param {object} childRect             position and dimensions of the child object.
     * @param {Number} margin                margin between the popup and the target
     * @param {Object} boxShadow             calculated size of box-shadow property of child
     * @param {object} currentPosition       current calculations for positioning the popup
     * @param {object} currentPositionType   current type of position or alignment
     *
     * @return {object} result
     */
    function _tryRightPosition(targetRect, childRect, margin, boxShadow, currentPosition, currentPositionType) {
        var finalMargin = margin + boxShadow.left,
            available = _getPageSize(this.ownerDocument).width - targetRect.right,
            needed = childRect.width + finalMargin;

        if (needed < available) {
            currentPositionType.position = 'right';
            currentPosition.y = targetRect.right + finalMargin;
        }
    }

    /**
     * Math to determine if the left position is available.
     *
     * @param {object} targetRect            position and dimensions of the parent object.
     * @param {object} childRect             position and dimensions of the child object.
     * @param {Number} margin                margin between the popup and the target
     * @param {Object} boxShadow             calculated size of box-shadow property of child
     * @param {object} currentPosition       current calculations for positioning the popup
     * @param {object} currentPositionType   current type of position or alignment
     *
     * @return {object} result
     */
    function _tryLeftPosition(targetRect, childRect, margin, boxShadow, currentPosition, currentPositionType) {
        var finalMargin = margin + boxShadow.right,
            available = targetRect.left,
            needed = childRect.width + finalMargin;

        if (needed < available) {
            currentPositionType.position = 'left';
            currentPosition.y = targetRect.left - needed;
        }
    }

    /**
     * Math to determine if the left alignment is available.
     *
     * @param {object} targetRect            position and dimensions of the parent object.
     * @param {object} childRect             position and dimensions of the child object.
     * @param {object} currentPosition       current calculations for positioning the popup
     * @param {object} currentPositionType   current type of position or alignment
     *
     * @return {object} result
     */
    function _tryLeftAlignment(targetRect, childRect, currentPosition, currentPositionType) {
        var available = _getPageSize(this.ownerDocument).width - targetRect.left,
            needed = childRect.width;

        if (needed < available) {
            currentPositionType.alignment = 'left';
            currentPosition.y = targetRect.left;
        }
    }

    /**
     * Math to determine if the center alignment is available.
     *
     * @param {object} targetRect            position and dimensions of the parent object.
     * @param {object} childRect             position and dimensions of the child object.
     * @param {object} currentPosition       current calculations for positioning the popup
     * @param {object} currentPositionType   current type of position or alignment
     *
     * @return {object} result
     */
    function _tryCenterAlignment(targetRect, childRect, currentPosition, currentPositionType) {
        var available = _getPageSize(this.ownerDocument).width,
            needed = childRect.width,
            halfChild,
            targetCenterPos;

        if (needed < available) {
            currentPositionType.alignment = 'center';

            halfChild = childRect.width / 2;
            targetCenterPos = targetRect.left + (targetRect.width / 2);

            if (targetCenterPos > halfChild) {
                // Popup left half fits
                if (targetCenterPos + halfChild < available) {
                    // Popup fits centered
                    currentPosition.y = targetCenterPos - halfChild;
                } else {
                    // Popup doesn't fit on the right, so will be sticky to that side
                    currentPosition.y = available - childRect.width;
                }
            } else {
                // Popup doesn't fit on the left, so will be sticky to that side
                currentPosition.y = 0;
            }
        }
    }

    /**
     * Math to determine if the right alignment is available.
     *
     * @param {object} targetRect            position and dimensions of the parent object.
     * @param {object} childRect             position and dimensions of the child object.
     * @param {object} currentPosition       current calculations for positioning the popup
     * @param {object} currentPositionType   current type of position or alignment
     *
     * @return {object} result
     */
    function _tryRightAlignment(targetRect, childRect, currentPosition, currentPositionType) {
        var available = targetRect.right,
            needed = childRect.width;

        if (needed < available) {
            currentPositionType.alignment = 'right';
            currentPosition.y = targetRect.left - childRect.width + targetRect.width;
        }
    }

    /**
     * Math to determine if the top alignment is available.
     *
     * @param {object}   targetRect          position and dimensions of the parent object.
     * @param {object}   childRect           position and dimensions of the child object.
     * @param {object}   currentPosition     current calculations for positioning the popup
     * @param {object}   currentPositionType current type of position or alignment
     * @param {Boolean}  force               when set on true, forces the positioning (used as fallback)
     *
     * @return {object} result
     */
    function _tryTopAlignment(targetRect, childRect, currentPosition, currentPositionType, force) {
        var available = _getPageSize(this.ownerDocument).height - targetRect.top,
            needed = childRect.height;

        if ((needed < available) || force) {
            currentPositionType.alignment = 'top';
            currentPosition.x = targetRect.top;
        }
    }

    /**
     * Math to determine if the middle alignment is available.
     *
     * @param {object} targetRect            position and dimensions of the parent object.
     * @param {object} childRect             position and dimensions of the child object.
     * @param {object} currentPosition       current calculations for positioning the popup
     * @param {object} currentPositionType   current type of position or alignment
     *
     * @return {object} result
     */
    function _tryMiddleAlignment(targetRect, childRect, currentPosition, currentPositionType) {
        var available = _getPageSize(this.ownerDocument).height,
            child,
            targetPos;

        currentPositionType.alignment = 'middle';

        child = childRect.height;
        targetPos = targetRect.top;

        // Popup top half fits
        if (targetPos + child < available) {
            // Popup fits centered
            currentPosition.x = targetPos;
        } else {
            // Popup doesn't fit on the bottom, so will be sticky to that side
            currentPosition.x = Math.max(0, available - childRect.height);
        }
    }

    /**
     * Math to determine if the bottom alignment is available.
     *
     * @param {Object} targetRect position and dimensions of the parent object.
     * @param {Object} childRect position and dimensions of the child object.
     * @param {Object} currentPosition current calculation for positioning the popup
     * @param {Object} currentPositionType
     */
    function _tryBottomAlignment(targetRect, childRect, currentPosition, currentPositionType) {
        var available = targetRect.bottom,
            needed = childRect.height;

        if (needed < available) {
            currentPositionType.alignment = 'bottom';
            currentPosition.x = targetRect.bottom - needed;
        }
    }

    /**
     * Calculates document width and height in a crossbrowser way
     * @param  {HTMLElement} elementOwnerDocument ownerDocument property of an element contained in the document
     * @return {Object}         object.height   {Number}
     *                          object.width    {Number}
     */
    function _getPageSize(elementOwnerDocument) {
        var documentEl = elementOwnerDocument.documentElement,
            bodyEl = elementOwnerDocument.body;

        return {
            width: Math.max(
                    bodyEl.scrollWidth, documentEl.scrollWidth,
                    bodyEl.offsetWidth, documentEl.offsetWidth,
                    bodyEl.clientWidth, documentEl.clientWidth
                ),
            height: Math.max(
                bodyEl.scrollHeight, documentEl.scrollHeight,
                bodyEl.offsetHeight, documentEl.offsetHeight,
                bodyEl.clientHeight, documentEl.clientHeight
                )
        };
    }

    /**
     * Calculates position for the popup
     * @param  {HTMLElement}    component                   component to be rendered as a popup
     * @param  {Object}         target                      contains position and dimensions of target element
     * @param  {Array}          positionOrder               ordered list of possible positions to fit the popup
     * @param  {Object}         alignmentOrder              ordered list of possible alignments to try to fit the popup
     * @param  {Object}         margin                      margin between the popup and the target
     * @param  {Object}         customPositioningMethods    custom position or alignment methods
     * @return {Object}         object.x
     *                          object.y
     *                          object.positionFound
     *                          object.alignmentFound
     */
    function _getPopupPosition(component, target, positionOrder, alignmentOrder, margin, customPositioningMethods) {
        var currentPosition = {
                x: -1,
                y: -1
            },
            positionMap = {
                'top': _tryTopPosition,
                'left': _tryLeftPosition,
                'right': _tryRightPosition,
                'bottom': _tryBottomPosition
            },
            alignmentMap = {
                'top': _tryTopAlignment,
                'left': _tryLeftAlignment,
                'right': _tryRightAlignment,
                'bottom': _tryBottomAlignment,
                'middle': _tryMiddleAlignment,
                'center': _tryCenterAlignment
            },
            boxShadow = {
                top: 0,
                left: 0,
                right: 0,
                bottom: 0
            },
            currentPositionType = {},
            childRect,
            connector = component.querySelector('.connector'),
            targetRect,
            positionFound,
            alignmentFound,
            verticalPosition,
            method,
            posibleAlignments;

        customPositioningMethods = customPositioningMethods || {};
        targetRect = _getRect(target);
        if (!component.style.minWidth) {
            component.style.minWidth = targetRect.width + 'px';
        }
        childRect = _getRect(component);

        // If the component has a connector, we need to add extra margin
        if (connector) {
            margin = BASE_MARGIN + (margin || CONNECTOR_MARGIN);
        } else {
            margin = BASE_MARGIN + (margin || 0);
            boxShadow = getBoxShadowSize(component);
        }

        // Checks every position on the array until one fits on the page
        positionFound = positionOrder.some(function(pos) {
            var method = customPositioningMethods[pos] || positionMap[pos];
            if (method) {
                method.call(target, targetRect, childRect, margin, boxShadow, currentPosition, currentPositionType);
                return currentPositionType.position;
            }
        });

        if (!positionFound) {
            method = customPositioningMethods.bottom || positionMap.bottom;
            // If there's no space anywhere, popup is forced to be added at the bottom
            method.call(target, targetRect, childRect, margin, boxShadow, currentPosition, currentPositionType, true);
        }

        verticalPosition = VERTICAL_POSITIONS.indexOf(currentPositionType.position) > -1;
        if (verticalPosition) {
            posibleAlignments = HORIZONTAL_ALIGNMENTS;
        } else {
            posibleAlignments = VERTICAL_ALIGNMENTS;
        }

        // Check every alignment on the array that matches with the position until one fits on the page
        alignmentFound = alignmentOrder.some(function(align) {
            var method;
            if (posibleAlignments.indexOf(align) > -1) {
                method = customPositioningMethods[align] || alignmentMap[align];
                method.call(target, targetRect, childRect, currentPosition, currentPositionType);
                return currentPositionType.alignment;
            }
        });

        // If there's no space anywhere, popup is forced to be aligned to the top
        if (!alignmentFound && !verticalPosition) {
            method = customPositioningMethods.top || alignmentMap.top;
            alignmentMap.top.call(target, targetRect, childRect, currentPosition, currentPositionType, true);
        }

        if (connector && currentPositionType.alignment === 'middle') {
            // TODO: handle connector with height different from 14px
            // Problem: at this point, '_getRect(connector)' returns 0-values
            connector.style.top = ((Math.min(childRect.height, targetRect.height) - 14) / 2) + 'px';
        }

        return {
            'currentPosition': currentPosition,
            'currentPositionType': currentPositionType
        };
    }

    /**
     * Resets all position and alignments classes
     * @param  {HTMLElement} component Component to clear classes
     */
    function _clearPosition(component) {
        VERTICAL_POSITIONS.forEach(function(pos) {
            this.classList.remove('position-' + pos);
        }, component);

        HORIZONTAL_POSITIONS.forEach(function(pos) {
            this.classList.remove('position-' + pos);
        }, component);

        VERTICAL_ALIGNMENTS.forEach(function(alignment) {
            this.classList.remove('alignment-' + alignment);
        }, component);

        HORIZONTAL_ALIGNMENTS.forEach(function(alignment) {
            this.classList.remove('alignment-' + alignment);
        }, component);
    }

    /**
     * Updates styles of component with position and alignments
     * @param  {HTMLElement}    component      Component to show as a popup
     * @param  {Object}         positionTarget Position and alignments to be set
     */
    function _updateComponent(component, positionTarget) {
        _clearPosition(component);

        component.classList.add('position-' + positionTarget.currentPositionType.position);
        component.classList.add('alignment-' + positionTarget.currentPositionType.alignment);

        component.style.top = positionTarget.currentPosition.x + 'px';
        component.style.left = positionTarget.currentPosition.y + 'px';
    }

    /**
     * Sets position order and alignment order based on parameters or default values
     * Obtains coordinates for popup
     * Updates component with new coordinates
     * @param  {HTMLElement}    component                   component to show as a popup
     * @param  {HTMLElement}    referenceElement            reference element to position the popup
     * @param  {Array}          positions                   ordered list of possible positions to fit the popup
     * @param  {Array}          alignment                   ordered list of possible alignments to try to fit the popup
     * @param  {Number}         margin                      margin to add to the BASE_MARGIN
     * @param  {Object}         customPositioningMethods    custom position or alignment methods
     * @return {Boolean}                                    true if a position for the popup could be found
     */
    function _setPosition(component, referenceElement, positions, alignment, margin, customPositioningMethods) {

        var finalAlignment,
            positionTarget,
            orderPosition;

        orderPosition = positions || ['bottom', 'top'];
        finalAlignment = alignment || ['left', 'right'];

        positionTarget = _getPopupPosition(component, referenceElement, orderPosition, finalAlignment, margin, customPositioningMethods);

        if (!positionTarget.currentPositionType.position || !positionTarget.currentPositionType.alignment) {
            _hide(component);
            return false;
        }

        _updateComponent(component, positionTarget);

        return true;

    }

    /**
     * Adds listener for browser resize.
     * @param  {HTMLElement}    popupElement                Component where a resize listening method should be installed
     * @param  {HTMLElement}    referenceElement            Reference element to position the popup
     * @param  {Array}          positions                   ordered list of possible positions to fit the popup
     * @param  {Array}          alignment                   ordered list of possible alignments to try to fit the popup
     * @param  {Number}         margin                      margin to add to the BASE_MARGIN
     * @param  {Object}         customPositioningMethods    custom position or alignment methods
     * @return {Function}                                   Return a reference for future removal of listener
     */
    function _installResizeMethod(popupElement, referenceElement, positions, alignment, margin, customPositioningMethods) {
        var resizeMethod;

        resizeMethod = function() {
            if (popupElement.classList.contains('visible')) {
                _setPosition(popupElement, referenceElement, positions, alignment, margin, customPositioningMethods);
            }
        };

        Viewport.onResize(resizeMethod);

        return resizeMethod;
    }

    /**
     * Removes listener for browser resize
     * @param  {Function} callback Reference of the listener to remove
     */
    function _uninstallResizeMethod(callback) {
        Viewport.offResize(callback);
    }

    /**
     * Calculates popup position based on the reference HTML element on conf.target.
     * Then, calls popupElement.show.
     * @param  {HTMLElement}    popupElement                component to show as a popup
     * @param  {HTMLElement}    referenceElement            reference element to position the popup
     * @param  {Array}          positions                   ordered list of possible positions to fit the popup
     * @param  {Array}          alignment                   ordered list of possible alignments to try to fit the popup
     * @param  {Number}         margin                      margin to add to the BASE_MARGIN
     * @param  {Object}         customPositioningMethods    custom position or alignment methods
     */
    function _show(popupElement, referenceElement, positions, alignment, margin, customPositioningMethods) {
        var setupSuccessful = false;

        if (!document.body.contains(referenceElement)) {
            // Silently fail if the target is not in the DOM.
            return;
        }

        if (popupElement.show && !popupElement.classList.contains('visible')) {
            setupSuccessful = _setPosition(popupElement, referenceElement, positions, alignment, margin, customPositioningMethods);
            if (setupSuccessful) {
                popupElement.show();
            }
        }

    }

    /**
     * Hides the previously shown component
     * @param  {HTMLElement} popupElement Component to be hidden
     */
    function _hide(popupElement) {
        if (popupElement && popupElement.open) {
            popupElement.close();
        }
    }

    return {
        installResizeMethod: _installResizeMethod,
        uninstallResizeMethod: _uninstallResizeMethod,
        clearPosition: _clearPosition,
        setPosition: _setPosition,
        show: _show,
        hide: _hide
    };
});

define('hui/core/tooltip',[], function() {
    function resetTooltipDismissal(tooltip) {
        var leaveEvent = tooltip.trigger === 'focus' ? 'blur' : 'mouseleave',
            numTargets = tooltip._listenersTargets.length,
            elem,
            target;
        for (elem = 0; elem < numTargets; ++elem) {
            target = tooltip._listenersTargets[elem];
            if (target) {
                if (!tooltip.dismissible && tooltip.duration <= 0  && tooltip.trigger !== 'custom') {
                    tooltip.listenTo(target, leaveEvent, tooltip._hideCallback, true);
                } else {
                    tooltip.stopListening(target, leaveEvent, tooltip._hideCallback, true);
                }
            }
        }
    }

    return {
        /**
         * When targets change, we need to remove the listeners from the old targets
         * @param  {HTMLElement} tooltip Current tooltip
         */
        removeOldListeners: function(tooltip) {
            var numTargets = tooltip._listenersTargets.length,
                leaveEvent = tooltip.trigger === 'focus' ? 'blur' : 'mouseleave',
                enterEvent = tooltip.trigger === 'hover' ? 'mouseenter' : 'focus',
                elem, target;
            for (elem = 0; elem < numTargets; ++elem) {
                target = tooltip._listenersTargets[elem];
                tooltip.stopListening(target, enterEvent, tooltip._showCallback, true);
                tooltip.stopListening(target, leaveEvent, tooltip._hideCallback, true);
            }
        },

        /**
         * Removes old event listeners and add new ones
         * @param {HTMLElement} tooltip   The current tooltip
         * @param {String} newEvent  The new event to attach listeners to
         */
        resetListeners: function(tooltip, newEvent) {
            var enterEvent, oldEnterEvent, elem, target;

            if (newEvent === 'hover') {
                oldEnterEvent = 'focus';
                enterEvent = 'mouseenter';
            } else if (newEvent === 'focus') {
                oldEnterEvent = 'mouseenter';
                enterEvent = 'focus';
            }

            // Remove listener for each target
            for (elem = 0; elem < tooltip._listenersTargets.length; ++elem) {
                target = tooltip._listenersTargets[elem];
                if (target) {
                    tooltip.stopListening(target, oldEnterEvent, tooltip._showCallback, true);
                    if (tooltip.trigger !== 'custom') {
                        tooltip.listenTo(target, enterEvent, tooltip._showCallback, true);
                    }
                }
            }
            resetTooltipDismissal(tooltip);
        },

        /**
         * Updates the way in which the tooltip dismissal is handled
         * @param {HTMLElement} tooltip   The current tooltip
         */
        resetTooltipDismissal: resetTooltipDismissal,

        /**
         * Caches the tooltip targets in a "private" variable for future use
         * @param {HTMLElement} tooltip   The current tooltip
         * @param {String} targetSelector A selector to match the desired targets
         */
        setTooltipTargets: function(tooltip, targetSelector) {
            if (targetSelector.indexOf('_previousSibling') === -1) {
                tooltip._listenersTargets = tooltip.ownerDocument.querySelectorAll(targetSelector);
            } else {
                var restOfSelector = targetSelector.split('_previousSibling')[1];
                if (restOfSelector) {
                    tooltip._listenersTargets = [tooltip.previousElementSibling.querySelector(restOfSelector.trim()) || tooltip.previousElementSibling];
                } else {
                    tooltip._listenersTargets = [tooltip.previousElementSibling];
                }
            }
        }
    };
});

define('register-component/v2/register',[], function() {

    var doc = typeof document !== "undefined" && document,  // "typeof document" check so module loads in NodeJS

    /**
     * Internal registry of widget class metadata.
     * Key is custom widget tag name, used as Element tag name like <ha-text-field>
     * Value is metadata about the widget, including its prototype, ex: {prototype: object, extends: "button", ... }
     * @type {Object}
     */
    registry = {};

    function register(tag, proto) {
        //var bases, baseElement;

        // Check to see if the custom tag is already registered
        if (tag in registry) {
            throw new TypeError("A widget is already registered with tag '" + tag + "'.");
        }
        var config = registry[tag] = {
            prototype: proto
        };
        return doc.registerElement(tag, config);
    }

    return register;
});
define('object-utils/classes',[],function() {
    "use strict";

    // Credit where credit is due: the concept of efficiently supporting strict mode by placing a super method
    // on the constructor itself comes from Closure Library (https://github.com/google/closure-library)

    var _defineProperty             = Object.defineProperty,
        _defineProperties           = Object.defineProperties,
        _getOwnPropertyDescriptor   = Object.getOwnPropertyDescriptor;

    function _noSuper() {
        throw new Error("No super method");
    }

    function _bindMethod(methodName, methodFunc, superPrototype) {
        var superMethod = superPrototype && superPrototype[methodName];

        // Makes them non-enumerable and non-writable
        _defineProperties(methodFunc, {
            super: {
                value: superMethod ? function() {
                    return superMethod.call.apply(superMethod, arguments);
                } : _noSuper
            },
            applySuper: {
                value: superMethod ? function(thisObj, args) {
                    return superMethod.apply(thisObj, args);
                } : _noSuper
            },
        });
    }

    function _defineMethods(target, methods, superPrototype) {
        for (var propertyName in methods) {
            if (methods.hasOwnProperty(propertyName)) {
                var propertyDescriptor = _getOwnPropertyDescriptor(methods, propertyName),
                    propertyValue = propertyDescriptor.value;

                if (typeof propertyValue === "function") {
                    _bindMethod(propertyName, methods[propertyName], superPrototype);
                    _defineProperty(target, propertyName, {
                        value: methods[propertyName],
                        writable: true,
                        configurable: true
                    });
                } else if (propertyDescriptor.get || propertyDescriptor.set) {
                    _defineProperty(target, propertyName, propertyDescriptor);
                } else {
                    throw new Error("Not a method: " + propertyName);
                }
            }
        }
    }

    /**
     * Defines a class, mimicking the behavior of ECMAScript's class syntax as much as possible within ES5 code.
     * Supports dynamic getters and setters, and prototype methods. Both are handled similarly to ES6 classes,
     * including marking methods as non-enumerable.
     *
     * Any JavaScript constructor can be used for superConstructor, including Object; to create a new base class,
     * you would normally use Object for the superConstructor. If you wish to inherit from null so even
     * Object.prototype's methods aren't inherited, use null for the superConstructor.
     *
     * Adds the method '_callSuper(thisObj, methodName, ...args)' to constructor, for calling super-methods.
     *
     * constructor will also inherit any static properties defined on superConstructor, and can define its
     * own static methods in the static object. Static methods cannot use _callSuper(); instead, they should
     * call an overridden method directly using SuperConstructor.methodName.call(this, ...).
     *
     *    static: {
     *        aStaticMethod: function() { ... }
     *    }
     *
     * This cannot be used to subclass host/DOM constructors or exotic built-ins like Array, Function, or RegExp.
     *
     * @param {function=} superConstructor  A super class, constructor, or null. Any constructor function can be used.
     *                                      Use Object to inherit from Object (the default), and null to inherit from
     *                                      nothing at all.
     * @param {object} methods
     * @returns {*}
     */
    function extend(superConstructor, methods) {
        if (!methods) {
            methods = {};
        }

        var constructor = methods.hasOwnProperty("constructor") && methods.constructor;

        if (!constructor) {
            // Generate default constructor
            constructor = (superConstructor && superConstructor !== Object) ? function AnonymousClass() {
                return superConstructor.apply(this, arguments) || this;
            } : function AnonymousClass() { };
        }
        _bindMethod("constructor", constructor, superConstructor && superConstructor.prototype);
        delete methods.constructor;

        // Basic inheritance setup
        inherits(constructor, superConstructor);

        // Copy static methods to constructor
        var statics = methods.static;
        delete methods.static;
        if (statics) {
            _defineMethods(constructor, statics, superConstructor);
        }
        if (superConstructor && superConstructor !== Object) {
            inheritStatics(constructor, superConstructor);
        }

        // Setup prototype methods
        _defineMethods(constructor.prototype, methods, superConstructor && superConstructor.prototype);

        return constructor;
    }

    /**
     * Similar to Object.create, classes.createObject() generates a child of the given prototype.
     * However, it uses the classes.extend() syntax for the provided methods and function.super() is supported.
     *
     * @param {object?} prototype
     * @param {object?} methods
     * @returns {object}
     */
    function createObject(prototype, methods) {
        var child = Object.create(prototype);

        if (methods) {
            _defineMethods(child, methods, prototype);
        }

        return child;
    }

    /**
     * Causes constructor.prototype to inherit from superConstructor.prototype.
     * Adds the method '_callSuper(thisObj, methodName, ...args)' to constructor, for calling super-methods
     *
     * Should be called before constructor's prototype is modified.
     *
     * This function is a low-level implementation designed to work with vanilla JavaScript constructors
     * and prototypes. For a more full-featured ES6-style syntax, use classes.extend().
     *
     * @param {function} constructor        A constructor function
     * @param {function?} superConstructor  The super-constructor function it's inheriting from, or null
     */
    function inherits(constructor, superConstructor) {
        var superPrototype = superConstructor ? superConstructor.prototype : null,
            arraySlice = Array.prototype.slice;

        constructor.prototype = Object.create(superPrototype, {
            constructor: {
                value: constructor
            }
        });

        _defineProperty(constructor, "_callSuper", {
            value: function _callSuper(thisObj, methodName /*,  ...args */) {
                return superPrototype[methodName].apply(thisObj, arraySlice.call(arguments, 2));
            }
        });
    }

    /**
     * Copies all static properties from superConstructor to constructor, except any overridden by constructor.
     *
     * This function is a low-level implementation designed to work with vanilla JavaScript constructors.
     * For a more full-featured ES6-style syntax, use classes.extend().
     *
     * There is no low level '_callSuper()' equivalent for static methods, but you can call the super implemtation
     * directly with MySuperClass.methodName.call(this, ...args).
     *
     * Should be called before constructor's prototype is modified.
     *
     * @param {function} constructor        A constructor function
     * @param {function?} superConstructor  The super-constructor function it's inheriting from, or null
     */
    function inheritStatics(constructor, superConstructor) {
        var propertyName, propertyNames, i, l;

        propertyNames = Object.getOwnPropertyNames(superConstructor);
        for (i = 0, l = propertyNames.length; i < l; i++) {
            propertyName = propertyNames[i];
            if ( !(propertyName in constructor) ) {
                _defineProperty(constructor, propertyName, _getOwnPropertyDescriptor(superConstructor, propertyName));
            }
        }
    }

    return {
        createObject: createObject,
        extend: extend,
        inherits: inherits,
        inheritStatics: inheritStatics,
    };
});
define('register-component/v2/UIComponent',[
    "object-utils/classes"
], function(classes) {
    "use strict";

    var UIComponent,
        componentIdCounter = 0,
        listenToCounter = 0,

        _defineProperty = Object.defineProperty;

    function matchesSelectorListener(selector, listener, contextNode) {
        return function(e) {
            var matchesTarget = matches(e.target, selector, contextNode);
            if (matchesTarget) {
                listener(e, matchesTarget);
            }
        };
    }

    function _isTypeObject(what) {
        return what.stringify && what.parse;
    }

    function _parseTypeCast(what, propertyName) {
        if (what) {
            if (typeof what === "function") {
                what = {
                    stringify: what,
                    parse: what
                };
            }
            if (!_isTypeObject(what)) {
                throw new TypeError(propertyName + ": invalid type");
            }
        }
        return what || null;
    }

    // like _assertFunction but can take a string method name, allowing child overrides
    function _assertMethodIfExists(what, optionName, propertyName) {
        var type = typeof what;
        if (what && !(type === "function" || type === "string")) {
            throw new TypeError(propertyName + ": " + optionName + " not a function or method name");
        }
        return what || null;
    }

    /**
     * Makes a (non-enumerable) own object if necessary
     *
     * @param {Object} object Some object
     * @param {string} propertyName
     * @returns {object}
     * @private
     */
    function _objectMap(object, propertyName) {
        if (!object.hasOwnProperty(propertyName)) {
            _defineProperty(object, propertyName, {
                value: Object.create(null)
            });
        }
        return object[propertyName];
    }

    /**
     * Check if a node match the current selector within the constraint of a context node
     * @param  {HTMLElement} node        The node that originate the event
     * @param  {String} selector         The selector to check against
     * @param  {HTMLElement} contextNode The context to search in
     * @return {HTMLElement|Boolean}     The matching node if any. Else you get false.
     */
    function matches(node, selector, contextNode) {
        var matchesSelector = node.matches || node.webkitMatchesSelector || node.mozMatchesSelector || node.msMatchesSelector;

        while (node && node.nodeType === 1 && node !== contextNode) {
            if (matchesSelector.call(node, selector)) {
                return node;
            } else {
                node = node.parentNode;
            }
        }
        return false;
    }

    function _makeGetConverter(propertyName, typeCast, defaultValue) {
        if (defaultValue === undefined) {
            defaultValue = null;
        }

        var parse = typeCast && typeCast.parse;

        return parse === Boolean ? function(value) {
            return value !== null && value !== "false";
        } : parse ? function(value) {
            return value === null ? defaultValue : parse(value, propertyName);
        } : function(value) {
            return value === null ? defaultValue : value;
        };
    }

    function _makeAttributeGetterSetter(object, propertyName, attributeName, typeCast, getConverter) {
        var stringify = typeCast && typeCast.stringify;

        _defineProperty(object, propertyName, {
            get: function() {
                return getConverter(this.getAttribute(attributeName));
            },
            set: stringify === Boolean ? function(value) {
                if (value) {
                    this.setAttribute(attributeName, attributeName);
                } else {
                    this.removeAttribute(attributeName);
                }
            } : stringify ? function(value) {
                value = (value === null ? value : stringify(value, propertyName));

                if (value === null) {
                    this.removeAttribute(attributeName);
                } else {
                    this.setAttribute(attributeName, value);
                }
            } : function(value) {
                if (value === null) {
                    this.removeAttribute(attributeName);
                } else {
                    this.setAttribute(attributeName, value);
                }
            }
        });
    }

    UIComponent = classes.createObject(HTMLElement.prototype, {

        /**
         * Initialization method (like a constructor)
         *
         * @protected
         */
        init: function() {
            /**
             * Root CSS class of the component
             * @member {String}
             * @protected
             */
            this.baseClass = "";

            /**
             * Unique id for this component, separate from id attribute (which may or may not be set).
             * @member {Number}
             * @constant
             * @readonly
             * @protected
             */
            this.componentId = 0;

            /**
             * Value returned by a handlebars AMD plugin or compatible template engine.
             * Specifies how to build the widget DOM initially and also how to update the DOM when
             * widget properties change.
             * @member {Function}
             * @protected
             */
            this.template = null;

            /**
             * Kick off the life-cycle of a component.
             *
             * Calls a number of component methods (`render()` which calls `preRender()` and `postRender()`),
             * some of which of you'll want to override.
             *
             * Don't override createdCallback.
             * @protected
             */
            this.componentId = ++componentIdCounter;
        },

        /**
         * Don't override createdCallback, which is used to both construct and render a component.
         * Instead override the above 'init' callback, which will be called after defaults are set but before
         * the component has been rendered.
         */
        createdCallback: function() {
            _defineProperty(this, "_attrChangeCalls", {
                value: {}
            });

            this.init();

            // handle initial class names
            if (this.baseClass) {
                var classNames = this.baseClass.split(" ").filter(Boolean);
                classNames.forEach(function(item) {
                    this.classList.add(item);
                }, this);
            }

            this._setupEventAttrbutes();

            this.render();

            this._rendered = true;

            this._initBoundProperties();
        },

        /**
         * Placeholder that _.super call works
         */
        attachedCallback: function() { },

        attributeChangedCallback: function(attrName, oldValue, newValue) {
            var attrRecord  = this._attributes && this._attributes[attrName.toLowerCase()];

            attrName = attrName.toLowerCase();

            if (attrRecord) {
                var pendingChangeCalls = this._attrChangeCalls;
                if (pendingChangeCalls[attrName] > 0) {
                    pendingChangeCalls[attrName]--;
                } else {
                    this._attributeChanged(attrName, oldValue, newValue);
                }
            }
        },

        /**
         * Processing before `render()`.
         *
         * @protected
         */
        preRender: function() { },

        /**
         * Processing after the DOM fragment is created from `render()`.
         *
         * Called after the DOM fragment has been created, but not necessarily
         * added to the document.  Do not include any operations which rely on
         * node dimensions or placement.
         *
         * @protected
         */
        postRender: function() { },

        /**
         * Construct the UI for this widget, filling in subnodes and/or text inside of this.
         * Most widgets will leverage handlebars AMD plugin to set `template`, rather than define this method.
         * @protected
         */
        render: function() {
            var str;

            if (this._rendered) {
                return;
            }

            this.preRender();

            if (this.template) {
                str = this.template(this);
                // remove the <template> tag
                this.innerHTML = str.replace(/<[\/]{0,1}(template|TEMPLATE)[^><]*>/g, "");
            }

            this.postRender();
        },

        /**
         * Calls the initial change handlers on any bound properties
         * @private
         */
        _initBoundProperties: function() {
            var attrChangeCalls = this._attrChangeCalls;

            for (var attrName in this._attributes) {
                attrChangeCalls[attrName.toLowerCase()] = 0;
                this._attributeChanged(attrName, null, this.getAttribute(attrName));
            }
        },

        /**
         * Registers attribute-property bindings and synchronous change handlers
         * Call this.setupProperties() from inside init() or Prototype.setupProperties() when creating the prototype
         *
         * Specify a mapping of property name to type conversion functions (such as Boolean, Number, String, etc)
         * or configuration objects, with the following properties (all optional)
         *
         * Boolean types are handled like native HTML boolean attributes (like option.selected): if an
         * attribute is present it's true, and if missing it's false. As a concession to template systems
         * that don't recognize nonstandard boolean attributes, it's also false if set to the string "false".
         *
         * The type option can take a simple type cast function or object with 'stringify' and 'parse' methods.
         * stringify() converts from an arbitrary property value to the DOM attribute's string representation,
         * and parse() converts it back. See the custom types in attributeTypes.js for examples.
         *
         *   - *type*: a type conversion function, which takes a string or user-provided value and outputs the desired
         *     type. The builtins Number, String, and Boolean will work as is, while other types will require a custom
         *     converter. Defaults (implicitly) to String, since actual values are stored in the DOM as strings.
         *   - *attribute*: the attribute name to map to. Defaults to the property name in lowercase.
         *     In HTML documents, attributes are case-insensitive but the provided case will reflect newly-created
         *     attributes.
         *   - *default*: the value when the attribute doesn't exist. Ignored for Booleans since their default
         *     is always false.
         *
         * @param {object} attributeMap
         */
        setupProperties: function(attributeMap) {

            var boundAttributes = _objectMap(this, "_attributes"),
                boundProperties = _objectMap(this, "_properties");

            for (var propertyName in attributeMap) {
                var attrOptions = attributeMap[propertyName],
                    typeCast, defaultValue, attrName, attrChangeCallback;

                if (typeof attrOptions === "function" || _isTypeObject(attrOptions)) {
                    typeCast = attrOptions;
                    attrOptions = {};
                } else {
                    typeCast = attrOptions.type || null;
                }
                typeCast = _parseTypeCast(typeCast, propertyName);

                attrChangeCallback = attrOptions.change;

                attrName = attrOptions.attribute || propertyName.toLowerCase();
                defaultValue = attrOptions["default"];

                var getConverter = _makeGetConverter(propertyName, typeCast, defaultValue);

                if (propertyName in boundProperties) {
                    throw new Error("Property " + propertyName + " already bound");
                }
                if (attrName.toLowerCase() in boundAttributes) {
                    throw new Error("Attribute " + attrName + " already bound");
                }

                _makeAttributeGetterSetter(this, propertyName, attrName, typeCast, getConverter);

                boundAttributes[attrName.toLowerCase()] = boundProperties[propertyName] = {
                    p: propertyName,
                    c: _assertMethodIfExists(attrOptions.change, "change callback", propertyName),
                    g: getConverter
                };
            }

            return this;
        },

        /**
         * Call the change handler for attrName, if one exists
         *
         * @param {string} attrName
         * @param {string} oldAttrValue
         * @param {string} newAttrValue
         * @private
         */
        _attributeChanged: function(attrName, oldAttrValue, newAttrValue) {
            var attrRecord  = this._attributes && this._attributes[attrName.toLowerCase()],
                changeCallback;

            if (attrRecord && (changeCallback = attrRecord.c)) {
                var typeCast = attrRecord.g,
                    newValue = typeCast(newAttrValue),
                    oldValue = typeCast(oldAttrValue);

                if (typeof changeCallback === "function") {
                    changeCallback.call(this, newValue, oldValue);
                } else {
                    this[changeCallback](newValue, oldValue);
                }
            }
        },

        /**
         * @private
         */
        _setupEventAttrbutes: function() {
            /** @const */
            var EVENT_ATTRIBUTE_RE = /^data-on-(.+)$/,
                attributes = this.attributes;

            for (var i = 0, l = attributes.length; i < l; i++) {
                var attribute = attributes[i],
                    attrNameMatch;
                if ((attrNameMatch = EVENT_ATTRIBUTE_RE.exec(attribute.name))) {
                    var eventName = attrNameMatch[1],
                        handlerName = attribute.value,
                        handlerFunc = this[handlerName];

                    if (typeof handlerFunc === "function") {
                        this.on(eventName, handlerFunc);
                    } else {
                        console.warn(this.nodeName + ": event handler \"" + handlerName + "\" is not " +  handlerName ? "a function" : "defined");
                    }
                }

            }
        },

        /**
         * On is a chainable method that allows us to bind a dom event to a `callback` function in the view's rootNode
         * @param  {String} type Then name of the dom event
         * @param  {Function} callback The callback function that gets called when a 'emit' happens
         * @return {Object} Returns the this object to allow for chaining.
         */
        on: function(type, callback) {
            return this.listenTo(this, type, callback);
        },

        /**
         * Off is a chainable method that removes one or many callbacks in the view's rootNode
         * @param  {String} type Name of the event. If `name` is null, removes all bound callbacks for all events
         * @param  {Function} callback If `callback` is null, removes all callbacks for the event
         * @return {Object} Returns the this object in order to allow chaining.
         */
        off: function(type, callback) {
            return this.stopListening(this, type, callback);
        },

        /**
         * Emits a syntethic event of specified type, firing all bound callbacks.
         * @param {String} type The name of the event.
         * @param {Object} eventObj An object that provides the properties for the event.
         * Can also contain `bubbles` and `cancelable` properties. See https://developer.mozilla.org/en/DOM/event.initEvent.
         * These properties are copied to the event object.
         * @return {Boolean} True if the event was not canceled, false if it was canceled.
         */
        emit: function(type, eventObj) {
            eventObj = eventObj || {};

            var nativeEvent,
                bubbles = "bubbles" in eventObj ? eventObj.bubbles : true,
                cancelable = "cancelable" in eventObj ? eventObj.cancelable : true;

            nativeEvent = this.ownerDocument.createEvent("HTMLEvents");
            nativeEvent.initEvent(type, bubbles, cancelable);

            for (var i in eventObj) {
                if (!(i in nativeEvent)) {
                    nativeEvent[i] = eventObj[i];
                }
            }
            return this.dispatchEvent(nativeEvent);
        },

        /**
         * @property _listeningTo
         * @type {Object}
         * @private
         */
        // _listeningTo: null

        /**
         * Tell an object to listen to a particular event on another object.
         * Allows the object to keep track of the events, and they can be removed all at once later on.
         *
         * @param {HTMLElement} obj        An Element you want to listen to
         * @param {String}      name       The event to listen to
         * @param {Function}    callback   The callback function that will be executed
         * @param {Boolean}     useCapture If true, useCapture indicates that the user wishes to initiate capture
         *
         * @return {HTMLElement} The element instance
         */
        listenTo: function(obj, name, callback, useCapture) {
            var listeningTo, id;

            if (!callback && typeof name === "object") {
                callback = this;
            }

            listeningTo = this._listeningTo || (this._listeningTo = {});
            id = "l" + (++listenToCounter);
            listeningTo[id] = {object: obj, name: name, callback: callback};

            // if dom node
            if (obj.addEventListener) {

                // supports name in the form of
                // "selector:click" e.g "a:click"
                var selector = name.match(/(.*):(.*)/);
                // if we have a selector:event, the last one is interpreted as an event, and we use event delegation
                if (selector) {
                    name = selector[2];
                    selector = selector[1];
                    callback = matchesSelectorListener(selector, callback, obj);
                    listeningTo[id].callback = callback;
                    listeningTo[id].name = name;
                }

                obj.addEventListener(name, callback, !!useCapture);
            } else if (obj.on) {
                obj.on(name, callback, this);
            }

            return this;
        },

        /**
         * Tell an object to stop listening to events. Either call stopListening with no arguments to have the object
         * remove all of its registered callbacks ...
         * or be more precise by telling it to remove just the events it's listening to on a specific object,
         * or a specific event, or just a specific callback.
         *
         * @param  {HTMLElement} [obj]        Optional If you want to stop listening to events for that particular Element only
         * @param  {String}      [name]       Optional event name
         * @param  {Function}    [callback]   Optional The listener function you want to stop listening
         * @param  {Boolean}     [useCapture] Optional Specifies whether the listener being removed was registered as a capturing listener or not. If not specified, useCapture defaults to false.
         *
         * @return {HTMLElement} The element instance
         */
        stopListening: function(obj, name, callback, useCapture) {
            var listeningTo = this._listeningTo,
                map = {},
                item,
                id;

            if (!listeningTo) {
                return this;
            }

            if (obj && !name && !callback) {
                // stopListening(obj)
                for (id in listeningTo) {
                    if (listeningTo[id].object === obj) {
                        map[id] = listeningTo[id];
                    }
                }
            } else if (obj && name && !callback) {
                // stopListening(obj, "click")
                for (id in listeningTo) {
                    if (listeningTo[id].object === obj && listeningTo[id].name === name) {
                        map[id] = listeningTo[id];
                    }
                }
            } else if (obj && name && callback) {
                // stopListening(obj, "click", callback)
                for (id in listeningTo) {
                    if (listeningTo[id].object === obj && listeningTo[id].name === name && listeningTo[id].callback === callback) {
                        map[id] = listeningTo[id];
                    }
                }
            } else if (!obj && !name && !callback) {
                // stopListening() stop listening to all
                map = listeningTo;
            }

            for (id in map) {
                item = map[id];

                // if dom node
                if (item.object.removeEventListener) {
                    item.object.removeEventListener(item.name, item.callback, !!useCapture);
                } else if (item.object.off) {
                    item.object.off(item.name, item.callback, this);
                }

                delete this._listeningTo[id];
            }

            return this;
        },

        /**
         * Overrides HTMLElement's setAttribute to call custom attribute change observers (declared with
         * setupProperties()) synchronously. This is needed because when WebComponent polyfills are used
         * attributeChangedCallback becomes asynchronous.
         *
         * @param {string} attrName
         * @param {*} attrValue
         */
        setAttribute: function setAttribute(attrName, /* jshint unused:false */ attrValue) {
            this._attrChangeCalls[ ("" + attrName).toLowerCase() ]++;

            var oldValue = this.getAttribute(attrName);
            setAttribute.applySuper(this, arguments);
            var newValue = this.getAttribute(attrName);

            if (oldValue !== newValue) {
                this._attributeChanged(attrName, oldValue, newValue);
            }
        },

        /**
         * Overrides HTMLElement's removeAttribute to call custom attribute change observers (declared with
         * setupProperties()) synchronously. This is needed because when WebComponent polyfills are used
         * attributeChangedCallback becomes asynchronous.
         *
         * @param {string} attrName
         */
        removeAttribute: function removeAttribute(attrName) {
            this._attrChangeCalls[ ("" + attrName).toLowerCase() ]++;

            var oldValue = this.getAttribute(attrName);
            removeAttribute.applySuper(this, arguments);

            if (oldValue !== null) {
                this._attributeChanged(attrName, oldValue, null);
            }
        }
    });

    return UIComponent;
});

define('hui/core/utils',[],function() {
    'use strict';

    /**
     * Return the set of keys of the object
     * @param  {Object} obj
     * @return {Array}  An array containg the set of keys of the object
     */
    function _allKeys(obj) {
        var keys = [],
            key;
        for (key in obj) {
            keys.push(key);
        }
        return keys;
    }

    var Utils = {
        /**
         * Retrieve the width of the string.
         * @param {String} text Text to be measured
         * @return {Number}
         */

        /**
         * Retrieve the width of the string.
         * @param  {String}         text            Text to be measured
         * @param  {String}         font            Text font
         * @param  {HTMLElement}    canvasElement   Optional. Useful to cache canvas when calling this method repeatedly
         * @return {Number}
         */
        getTextWidth: function(text, font, canvasElement) {
            var canvas = canvasElement || document.createElement('canvas'),
                context = canvas.getContext('2d'),
                width;

            context.font = font;

            width = Math.floor(context.measureText(text).width);
            // Width may be 0, in that case we don't want to add 1 px.
            return width ? width + 1 : width;
        },

        /**
         * Remove and returns the childNodes of a component safely.
         * The childNodes will be remove from the parent and
         * returned.
         * @param {HTMLElement} component The component where the nodes need to be removed
         * @param {NodeList} nodeList The NodeList of nodes to be remove
         * @return {Array} An array of the removed nodes.
         */
        removeNodesSafe: function(component, nodeList) {
            var removedChildNodes = [],
                nodes;

            nodes = Array.prototype.slice.apply(nodeList);
            nodes.map(function(node) {
                removedChildNodes.push(component.removeChild(node));
                if (node.render) {
                    node.render();
                }
            });

            return removedChildNodes;
        },

        /**
         * Inserts a node collection into component.
         * @param {HTMLElement} component   where the node list will be inserted.
         * @param {Array}       nodeList    nodes to be inserted.
         */
        appendChildCollection: function(component, nodeList) {
            var idx;

            for (idx = 0; idx < nodeList.length; ++idx) {
                component.appendChild(nodeList[idx]);
            }
        },

        /**
         * Stops propagation and default actions of event
         * @param  {event} evt Event to stop
         */
        stopEvent: function(evt) {
            evt.stopPropagation();
            evt.preventDefault();
        },

        /**
         * Answers the name of the animation events.
         * @return {Object} Object.animationstart {String}
         *                  Object.animationend {String}
         */
        getAnimationEventNames: function() {
            var animationstart =
                        'webkitAnimationName' in document.documentElement.style ?
                    'webkitAnimationStart' : 'animationstart',
                animationend =
                        'webkitAnimationName' in document.documentElement.style ?
                    'webkitAnimationEnd' : 'animationend';

            return {
                animationstart: animationstart,
                animationend: animationend
            };
        },

        /**
         * Search a specific node element and return it from the component.
         * @param {HTMLElement}  component       is the component which could have searched target.
         * @param {String}       targetTagName   is the component name to be searched.
         * @returns The component searched.
         */
        getComponentFromElement: function(component, targetTagName) {
            while (component && component.tagName !== targetTagName) {
                component = component.parentNode;
            }
            return component;
        },

        /**
         * Search a specific node element and return it from the component by className.
         * @param {HTMLElement}  component       is the component which could have searched target.
         * @param {String}       className   is the class name to be searched.
         * @returns The component searched.
         */
        getComponentFromElementByClassName: function(component, className) {
            while (component && !component.classList.contains(className)) {
                component = component.parentNode;
            }
            return component;
        },

        /**
         * Determines if a given component needs some sort of validation
         * @param  {HTMLElement} component The component to check
         * @return {Boolean}     True if the component defines a validation
         */
        validationRequired: function(component) {
            return component.required || component.pattern || component.validator || component.min || component.max || component.numeric || component.password;
        },

        /**
         * Takes a list of objects, and returns the union of all of them
         * Adapted from underscorejs.org
         * @param  {Object} obj The amount of objects passed is variable
         * @return {Object}     A new object containing the union of all keys and their corresponding values
         */
        extend: function(obj) {
            var length = arguments.length,
                source,
                index = 1,
                i = 0,
                key,
                keys,
                l;

            if (length < 2 || obj === null) {
                return obj;
            }
            for (index; index < length; index++) {
                source = arguments[index];
                keys = _allKeys(source);
                l = keys.length;

                for (i; i < l; i++) {
                    key = keys[i];
                    if (obj[key] === void 0) {
                        obj[key] = source[key];
                    }
                }
            }
            return obj;
        },

        stopNativeEvent: function(component, element, eventName) {
            component.listenTo(element, eventName, function(ev) {
                ev.stopPropagation();
            });
        },

        /**
         * Return the target related of the event with IE compliance way.
         * @param {Event} event that will be try to take the related target.
         * @returns {Object} The related target of the event.
         * @private
         */
        getSafeTargetFromEvent: function(event) {
            return event.relatedTarget || event.explicitOriginalTarget || document.activeElement;
        },

        /**
         * Returns the next sibling of the same type.
         * @param {Node} node The node we want to compare from.
         * @param {String} nodeName The node name.
         * @return {Node}  The next sibling of the same type.
         */
        getNextSiblingOfType: function(node, nodeName) {
            while ((node = node.nextSibling) && node.nodeName !== nodeName) {
            }
            return node;
        },

        /**
         * Returns the prev sibling of the same type.
         * @param {Node} node The node we want to compare from.
         * @param {String} nodeName The node name.
         * @return {Node}  The prev sibling of the same type.
         */
        getPrevSiblingOfType: function(node, nodeName) {
            while ((node = node.previousSibling) && node.nodeName !== nodeName) {
            }
            return node;
        },

        /**
         * Finds the difference between two arrays
         * @param  {Array} a
         * @param  {Array} b
         * @return {Array}   The difference between a and b
         */
        getArrayDiff: function(a, b) {
            a = a ? a : [];
            b = b ? b : [];
            return a.filter(function(item) {
                return b.indexOf(item) < 0;
            });
        },

        /**
         * Returns a direct child of a parent node, that matches the passed type, similar to do a parentNode > type selector
         * @param  {HTMLElement} parentNode  The node inside of which search for the element
         * @param  {String}      type        The type of the element to find
         * @return {HTMLElement}             The found element
         */
        getDirectChildByType: function(parentNode, type) {
            var children = parentNode.children,
                child;
            Array.prototype.forEach.call(children, function(node) {
                if (node.tagName.toLowerCase() === type) {
                    child = node;
                }
            });
            return child;
        },

        /**
         * Appends or removes the suffixText from text
         * @param {String} text The text
         * @param {String} suffixText The text to apply as a suffix
         * @param {Boolean} state Flag to determine if to add or remove the suffixText
         * @return {String} The processed text
         */
        toggleSuffixText: function(text, suffixText, state) {
            if (state) {
                if (text && text.slice(-2) !== suffixText) {
                    text += suffixText;
                }
            } else {
                if (text && text.slice(-2) === suffixText) {
                    text = text.slice(0, -2);
                }
            }

            return text;
        }
    };

    return Utils;
});

define('hui/core/keys',[
], function() {
    return {
        BACKSPACE: 8,
        TAB: 9,
        ENTER: 13,
        SPACEBAR: 32,
        ESCAPE: 27,
        END: 35,
        HOME: 36,
        LEFT: 37,
        UP: 38,
        RIGHT: 39,
        DOWN: 40,
        DELETE: 46,
        isLetter: function(keycode) {
            return (keycode > 64 && keycode < 91);
        },
        isNumber: function(keycode) {
            return ((keycode > 47 && keycode < 58) || (keycode > 95 && keycode < 106));
        },
        isSpecialChar: function(keycode) {
            return ((keycode > 106 && keycode < 112) || (keycode > 185 && keycode < 223));
        }
    };
});
define('hui/segmented-button',[
    'register-component/v2/register',
    'register-component/v2/UIComponent',
    'object-utils/classes',
    './core/utils',
    './core/keys'
], function(register, UIComponent, classes, utils, keys) {
    'use strict';

    /**
     * Arrows key press handler.
     * @param {HTMLElement} component
     * @param {Event} evt The key press event.
     */
    function _onButtonKeypress(component, evt) {
        var key = evt.keyCode,
            selectButton;

        if (key === keys.LEFT) {
            // left arrow
            selectButton = utils.getPrevSiblingOfType(evt.target, 'BUTTON');
        } else if (key === keys.RIGHT) {
            // right arrow
            selectButton = utils.getNextSiblingOfType(evt.target, 'BUTTON');
        }

        if (selectButton) {
            selectButton.focus();
            component.selectedItem = selectButton;
        }
    }

    /**
     * sets the spected properties to a clicked button
     * @param {Event} evt The click event that triggered the handler.
     * @emits HASegmentedButton#click
     */
    function _onButtonClick(evt) {
        evt.stopPropagation();
        var component = utils.getComponentFromElement(evt.target, 'HA-SEGMENTED-BUTTON');

        component.selectedItem = evt.target;
        component.emit('click');
    }

    /**
     * Given a SegmentedButton component, it removes all the aria pressed
     * from the elements who belong to the same group.
     * @param {HTMLElement} component The component to inspect.
     */
    function _removeARIAPressedFromGroup(component) {
        var buttons = component.buttons,
            i = 0;

        for (i; i < buttons.length; i++) {
            buttons[i].setAttribute('aria-pressed', false);
        }
    }

    var HASegmentedButton =  classes.createObject(UIComponent, {

        /**
         * buttons is the list of buttons that the segmented button owns
         * @type {Array}
         */
        set buttons(buttons) {
            var oldButtons = [].slice.call(this.querySelectorAll('button')),
                lastSelected,
                elements;

            oldButtons.forEach(function(btn) {
                this.stopListening(btn, 'click', _onButtonClick);
                this.removeChild(btn);
            }.bind(this));

            elements =  [].slice.call(buttons);

            elements.forEach(function(btn) {
                var label = btn.label || btn.getAttribute('label');

                btn.classList.add('ha-button');
                btn.disabled = btn.disabled || btn.getAttribute('disabled');

                if (label) {
                    console.warn('Label property is deprecated. Should use textContent instead.');
                }

                if (!btn.textContent && label) {
                    btn.textContent = label;
                }

                if (btn.getAttribute('selected') || btn.selected) {
                    // save as selected
                    lastSelected = btn;
                }

                btn.setAttribute('aria-pressed', false);

                this.listenTo(btn, 'click', _onButtonClick);

                // save buttons
                this._buttons.push(btn);

                this.appendChild(btn);

            }.bind(this));

            if (lastSelected) {
                // set last button to selected
                this.selectedIndex = [].indexOf.call(this.buttons, lastSelected);
            } else if (this._buttons.length > 0) {
                // set the default value
                this.selectedIndex = 0;
            }
        },

        /**
          * The selected button
          * @type {HTMLElement}
          */
        set selectedItem(selectedItem) {
            this._selectedItem = selectedItem;
            if (this.value !== selectedItem.value) {
                this.value = selectedItem.value;
            }
        },

        get buttons() {
            return this._buttons;
        },

        get selectedItem() {
            return this._selectedItem;
        },

        init: function _() {
            _.super(this);

            this.setupProperties({
                /**
                 * Index of the selected button
                 * @type {Number}
                 */
                selectedIndex: {
                    default: 0,
                    type: Number,
                    change: function(newValue) {
                        var button = this.buttons[newValue];

                        if (button) {
                            _removeARIAPressedFromGroup(this);
                            button.setAttribute('aria-pressed', true);
                            if (this.selectedItem !== button) {
                                this.selectedItem = button;
                            }
                        }
                    }
                },

                /**
                 * Value of the selected button
                 * @type {String}
                 * @emits HASegmentedButton#change
                 */
                value: {
                    default: '',
                    change: function(newValue) {
                        var buttons = [].slice.call(this.buttons);

                        if (newValue) {
                            buttons.every(function(btn, index) {
                                if (btn.value === newValue) {
                                    this.selectedIndex = index;
                                    return false;
                                } else {
                                    return true;
                                }
                            }.bind(this));

                            this.emit('change');
                        }
                    }
                },

                /**
                 * Name of the segmented-button
                 * @type {String}
                 */
                name: {
                    default: ''
                }
            });

            this.on('button:keydown', function(evt) {
                _onButtonKeypress(this, evt);
            }.bind(this));
        },

        postRender: function _() {
            _.super(this);

            var elements = this.querySelectorAll('button');

            this._buttons = [];
            this.buttons = elements;
        }
    });

    return register('ha-segmented-button', HASegmentedButton);
});

define('hui/radio-button',[
    'register-component/v2/register',
    'register-component/v2/UIComponent',
    'object-utils/classes'
], function(register, UIComponent, classes) {
    'use strict';

    var HARadioButton = classes.createObject(UIComponent, {

        init: function _() {

            _.super(this);

            this.setupProperties({
                /**
                 * label for the radio control
                 * @type {String}
                 */
                label: {
                    default: '',
                    change: function(newValue) {
                        var label = this._nodes.label;

                        label.textContent = newValue;
                        if (!newValue) {
                            this.removeAttribute('label');
                        }
                    }
                },

                /**
                 * this sets the value for the radio input
                 * @type {String}
                 */
                value: {
                    default: '',
                    change: function(newValue) {
                        this._nodes.input.value = newValue;
                    }
                },

                /**
                 * disabled indicates wheter the component is enabled or disabled
                 * @type {Boolean}
                 */
                disabled: {
                    default: false,
                    type: Boolean,
                    change: function(newValue) {
                        this._nodes.input.disabled = newValue;
                    }
                },

                /**
                 * checked indicates if the radio is checked
                 * @emits HARadioButton#change
                 * @type {Boolean}
                 */
                checked: {
                    default: false,
                    type: Boolean,
                    change: function(newValue) {
                        if (this._nodes.input.checked !== newValue) {
                            this._nodes.input.checked = newValue;
                        }
                    }
                },

                /**
                 * This is the name for the radio button group this element belongs to.
                 * @type {String}
                 */
                name: {
                    default: '',
                    change: function(newValue) {
                        this._nodes.input.name = newValue;
                    }
                }
            });
        },

        /**
         * @emits HARadioButton#click
         */
        postRender: function _() {
            _.super(this);

            this._nodes = {};

            var input = this.querySelector('input'),
                label = this.querySelector('label');
            if (!input) {
                input = this.ownerDocument.createElement('input');
                input.type = 'radio';
                this.appendChild(input);
            }
            input.id = 'ha-radio-button-' + this.componentId;
            this._nodes.input = input;

            if (!label) {
                label = this.ownerDocument.createElement('label');
                this.appendChild(label);
            }
            label.htmlFor = this._nodes.input.id;
            this._nodes.label = label;

            //Change listener from "change" to "click" event: regardless events registration sequence, Firefox will trigger click event first
            //and then change event, which would cause an issue in qbo data binding. Change to "click" event would resolve the issue.
            this.listenTo(input, 'click', function(evt) {
                evt.stopPropagation();
                this.checked = evt.target.checked;
                this.emit('click');
            }.bind(this));

            this.listenTo(input, 'change', function(evt) {
                evt.stopPropagation();
                this.emit('change');
            }.bind(this));

            // Clicking label should prevent click event bubbling up but since label and input are connected
            // by for/id attribute, browser will naturally fire click event of input, code above emits the
            // unified component click event
            this.listenTo(label, 'click', function(evt) {
                evt.stopPropagation();
            });
        }
    });

    return register('ha-radio-button', HARadioButton);
});

define('hui/validatable/base-validator',[
    'object-utils/classes',
    'register-component/v2/UIComponent'
], function(classes, UIComponent) {
    'use strict';

    var BaseValidator = classes.createObject(UIComponent, {
        /**
         * Override this in each validator to define a default message
         */
        init: function(validationType, options) {
            this.options = options;
            // needed so later we can query them if invalidMessage or requiredMessage is updated
            this.validationType = validationType;
            this.element = options.element;
            this.onInit();
        },

        test: function() {
            return false;
        },

        onInit: function() {

        },

        getValue: function() {
            return this.element.value;
        },

        matchToValue: function(regex) {
            var re = new RegExp(regex);
            return re.test(this.getValue());
        }
    });

    return BaseValidator;
});


define('hui/validatable/validators/required',[
    '../base-validator',
    'object-utils/classes'
], function(BaseValidator, classes) {
    'use strict';
    var RequiredValidator = classes.createObject(BaseValidator, {
        test: function() {
            var value = this.getValue();
            if (Array.isArray(value)) {
                return value.length > 0;
            } else {
                return !!value;
            }
        }
    });
    return RequiredValidator;
});

define('hui/validatable/validators/numeric',[
    '../base-validator',
    'object-utils/classes'
], function(BaseValidator, classes) {
    'use strict';

    var NumericValidator = classes.createObject(BaseValidator, {
        test: function() {
            return this.matchToValue('^[0-9]+$');
        }
    });

    return NumericValidator;
});
define('hui/validatable/validators/pattern',[
    '../base-validator',
    'object-utils/classes'
], function(BaseValidator, classes) {
    'use strict';

    var PatternValidator = classes.createObject(BaseValidator, {
        test: function() {
            return this.matchToValue(this.options.pattern);
        }
    });

    return PatternValidator;
});
define('hui/validatable/validators/function',[
    '../base-validator',
    'object-utils/classes'
], function(BaseValidator, classes) {
    'use strict';

    var FunctionValidator = classes.createObject(BaseValidator, {
        test: function() {
            return this.options.validatorFunc.call();
        }
    });

    return FunctionValidator;
});
define('hui/validatable/validators/min',[
    '../base-validator',
    'object-utils/classes'
], function(BaseValidator, classes) {
    'use strict';

    var MinValidator = classes.createObject(BaseValidator, {
        test: function() {
            return parseFloat(this.getValue()) >= this.options.minVal;
        }
    });

    return MinValidator;
});
define('hui/validatable/validators/max',[
    '../base-validator',
    'object-utils/classes'
], function(BaseValidator, classes) {
    'use strict';

    var MaxValidator = classes.createObject(BaseValidator, {
        test: function() {
            return parseFloat(this.getValue()) <= this.options.maxVal;
        }
    });

    return MaxValidator;
});
define('hui/validatable/validators/expected',[
    '../base-validator',
    'object-utils/classes'
], function(BaseValidator, classes) {
    'use strict';

    var expectedValueValidator = classes.createObject(BaseValidator, {
        test: function() {
            return this.getValue() === this.options.expectedValue;
        }
    });

    return expectedValueValidator;
});
define('hui/validatable/validators/min-required',[
    '../base-validator',
    'object-utils/classes'
], function(BaseValidator, classes) {
    'use strict';

    var minRequiredValidator = classes.createObject(BaseValidator, {
        test: function() {
            return this.element.value.length >= this.options.minRequired;
        }
    });

    return minRequiredValidator;
});
define('hui/validatable/validators',[
    // REGISTER VALIDATORS HERE
    './validators/required',
    './validators/numeric',
    './validators/pattern',
    './validators/function',
    './validators/min',
    './validators/max',
    './validators/expected',
    './validators/min-required'
], function(RequiredValidator, NumericValidator, PatternValidator, FunctionValidator, MinValidator, MaxValidator,
    ExpectedValidator, MinRequiredValidator) {
    'use strict';

    var registeredValidators = {
        'required': RequiredValidator,
        'numeric': NumericValidator,
        'pattern': PatternValidator,
        'validator': FunctionValidator,
        'min': MinValidator,
        'max': MaxValidator,
        'expected': ExpectedValidator,
        'minRequired': MinRequiredValidator
    };

    return {
        create: function(validationType, options) {
            var validator = registeredValidators[validationType];
            validator.init(validationType, options);

            return validator;
        }
    };
});

define('hui/tooltip',[
    'object-utils/classes',
    'register-component/v2/UIComponent',
    'register-component/v2/register',
    './core/popup',
    './core/tooltip',
    './core/utils'
],
function(classes, UIComponent, register, popup, coreTooltip, utils) {
    'use strict';
    var HaTooltip,
        /**
         * Static var to track the current target of the tooltip.
         * @type {HTMLElement}
         */
        TARGET = null;

    /**
     * Emits dismiss and hides the component
     * @param  {Event} evt Click event
     * @emits dismiss
     */
    function dismissibleTooltipClick(evt) {
        var component = evt.target;
        while (component.tagName !== 'HA-TOOLTIP') {
            component = component.parentElement;
        }
        component.emit('dismiss');
        component.close();
    }

    /**
     * Sets a delay to hide the popup
     */
    function hideAfterTimeout(evt) {
        var tooltip = evt.target;
        setTimeout(tooltip._hideCallback, tooltip.duration);
    }

    /**
     * Sets message on tooltip
     * @param {HTMLElement} tooltip Component to set the message to
     * @param {HTMLElement} target  Component that can have another message
     */
    function setMessage(tooltip, target) {
        var tooltipMessage = false,
            childrenLength,
            i,
            msg,
            content = tooltip.querySelector('.tooltip-inner');

        //Tooltip message can also be defined as an attribute of the target. If the target
        //defines a "tooltipMessage" attribute, we take that as the message for the tooltip
        if (target) {
            tooltipMessage = target.tooltipMessage || target.getAttribute('tooltipMessage');
        }

        //if target does not define a message, we take the one defined in the tooltip itself
        msg = tooltipMessage ? tooltipMessage : tooltip.message;

        if (msg) {
            if ('string' === typeof msg) {
                msg = [tooltip.ownerDocument.createTextNode(msg)];
            }

            childrenLength = content.childNodes.length;

            for (i = 0; i < childrenLength; i++) {
                content.removeChild(content.childNodes[0]);
            }

            content.innerHTML = '';
            utils.appendChildCollection(content, msg);
        }
    }

    /**
     * Obtains previous sibling or first occurrence in the dom that matches targetSelector.
     * Notice that targetSelector property can match many elements, but we only get the
     * first. Because this is used only when show() method is called directly, we don't have enought
     * information to decide which one to show.
     * @param  {HTMLElement} tooltip Current tooltip
     * @return {HTMLElement}         Element linked by targetSelector property
     */
    function getElementFromTargetSelector(tooltip) {
        if (tooltip.targetSelector === '_previousSibling') {
            return tooltip.previousElementSibling;
        } else {
            return tooltip.ownerDocument.querySelector(tooltip.targetSelector);
        }
    }

    HaTooltip = classes.createObject(UIComponent, {

        init: function _() {
            _.super(this);

            /**
             * Cached listeners of the defined event to show or hide the tooltip
             */
            this._listenersTargets = [];

            /**
             * Message that will be shown.
             * @type {String|HTMLElement}
             */
            this._message = '';

            // I need to store this callbacks in case the consumer changes the triggers
            this._hideCallback = this.close.bind(this);
            this._showCallback = this.show.bind(this);

            this.setupProperties({

                /**
                 * String describing the alignment of the tooltip.
                 * More than one alignment can be added and will be used as order of preference*
                 * Values can be:
                 *  - left
                 *  - right
                 * @default 'left'
                 * @type {String}
                 * @private
                 */
                _alignment: {
                    default: 'left'
                },

                /**
                 * Selector describing which is / are the parents of the tooltip.
                 * @type {String}
                 */
                targetSelector: {
                    default: '_previousSibling',
                    change: function(newValue) {
                        coreTooltip.removeOldListeners(this);
                        coreTooltip.setTooltipTargets(this, newValue);
                        coreTooltip.resetListeners(this, this.trigger);
                    }
                },

                /**
                 * String describing the position of the tooltip.
                 * More than one position can be added and will be used as order of preference
                 * Values can be:
                 *  - top
                 *  - bottom
                 * @default 'top bottom'
                 * @type {String}
                 */
                position: {
                    default: 'top bottom'
                },

                /**
                 * If the tooltip is dismissible by the user.
                 * A close button will be shown if this is true.
                 * @type {Boolean}
                 */
                dismissible: {
                    type: Boolean,
                    default: false,
                    change: function(newValue) {
                        if (newValue) {
                            this.classList.add('dismissible');
                            this.on('button:click', dismissibleTooltipClick);
                        } else {
                            this.classList.remove('dismissible');
                            this.off('button:click', dismissibleTooltipClick);
                        }
                        coreTooltip.resetTooltipDismissal(this);
                    }
                },

                /**
                 * Event that will be attached to the parent / parents that will trigger
                 * the show of the tooltip.
                 * @type {String}
                 */
                trigger: {
                    default: 'hover',
                    change: function(newValue) {
                        coreTooltip.resetListeners(this, newValue);
                    }
                },

                /**
                 * Sets the timeout (ms) to close the tooltip.
                 * A zero value means disabled.
                 * @type {Number}
                 */
                duration: {
                    default: 0,
                    change: function(newValue) {
                        if (newValue > 0) {
                            this.on('show', hideAfterTimeout);
                        } else {
                            this.off('show', hideAfterTimeout);
                        }
                        coreTooltip.resetTooltipDismissal(this);
                    }
                }
            });
        },

        /**
         * Bind the click event to the close button.
         * @emits HATooltip#show
         * @emits HATooltip#close
         */
        createdCallback: function _() {
            var animationEvts;
            _.super(this);

            animationEvts = utils.getAnimationEventNames();
            this.on(animationEvts.animationend, function(evt) {
                var target = evt.target;
                switch (evt.animationName) {
                    case 'ha-fade-in':
                        target.classList.remove('enter');
                        target.emit('show');
                        break;
                    case 'ha-fade-out':
                        target.classList.remove('leave');
                        target.classList.remove('visible');
                        target.emit('close');
                        popup.clearPosition(target);
                        break;
                }
            });
        },

        /**
         * Sets tooltip initial configs and resets event listeners.
         */
        attachedCallback: function() {
            coreTooltip.setTooltipTargets(this, this.targetSelector);
            coreTooltip.resetListeners(this, this.trigger);
            setMessage(this, getElementFromTargetSelector(this));
        },

        /**
         * Retrieves the targets.
         * Binds some event on them.
         * Makes a verification on the position config.
         */
        postRender: function _() {
            var divContainer,
                divText,
                message,
                innerContent,
                button;

            _.super(this);

            if (this.hasAttribute('message')) {
                message = this.getAttribute('message');
            } else {
                innerContent = this.querySelector('.tooltip-inner');
                if (innerContent) {
                    message = utils.removeNodesSafe(innerContent, innerContent.childNodes);
                } else {
                    message = utils.removeNodesSafe(this, this.children);
                }
            }

            divContainer = this.querySelector('div.tooltip-container');
            divText = this.querySelector('div.tooltip-inner');
            button = this.querySelector('button.btn-container');
            // We force a minWidth to avoid popup default behaviour of setting minWidth to
            // target's width (required by every other component)
            this.style.minWidth = '1px';

            // Creates template
            if (!divContainer) {
                divContainer = this.ownerDocument.createElement('div');
                divContainer.className = 'tooltip-container';

                button = this.ownerDocument.createElement('button');
                button.className = 'hi hi-close btn-icon-only';
                divContainer.appendChild(button);

                divText = this.ownerDocument.createElement('div');
                divText.className = 'tooltip-inner';
                divContainer.appendChild(divText);

                this.appendChild(divContainer);
            }
            this.message = message;
        },

        get message() {
            return this._message;
        },

        set message(newMessage) {
            this._message = newMessage;

            setMessage(this);
        },

        /**
         * Implements the logic to show the tooltip.
         * @param  {Event} evt Optional. When defined an event triggered this call
         */
        show: function(evt) {
            var MARGIN = 17,
                isVisible = this.classList.contains('visible'),
                target = (evt) ? evt.currentTarget : null,
                tooltips = [],
                tooltip,
                hasPositionSet,
                position,
                alignment,
                i;

            if (!target) {
                target = getElementFromTargetSelector(this);
            }

            // If it is visible but target is different is because
            // we are using the same instance in different targets,
            // so we want to move the tooltip to the next target.
            if (target) {
                setMessage(this, target);
                if (!TARGET || !target.isEqualNode(TARGET)) {
                    TARGET = target;
                    tooltips = this.ownerDocument.querySelectorAll('ha-tooltip.visible');
                    for (i = 0; i < tooltips.length; i++) {
                        tooltip = tooltips[i];
                        tooltip.close();
                    }
                }

                position = this.position.split(' ');
                alignment = this._alignment.split(' ');

                // If the same instance is fading out, we need to interrupt the animation and fade in. Position needs to be
                // calculated again if that's the case
                if (isVisible && this.classList.contains('leave')) {
                    this.classList.remove('leave');
                    popup.clearPosition(this);
                }

                // If position was already set (because this was called through popup) we don't need to calculate it again
                hasPositionSet = this.className.indexOf('position-') > -1;
                if (!hasPositionSet) {
                    if (popup.setPosition(this, target, position, alignment, MARGIN)) {
                        this._resizeMethod = popup.installResizeMethod(this, target, position, alignment, MARGIN);
                    } else {
                        return;
                    }
                }
                if (!isVisible) {
                    this.classList.add('visible');
                }
            }
        },

        /**
         * @deprecated use 'close' method instead
         * Hides the tooltip
         */
        hide: function() {
            this.close();
            console.warn('DEPRECATION WARNING: This method is deprecated, use "close" method instead');
        },

        /**
         * Implements the logic to hide the tooltip.
         */
        close: function() {
            // If we close a tooltip that is timed we
            // will have to ensure that the timeout stops.
            if (this._timed) {
                clearTimeout(this._timed);
                delete this._timed;
            }

            if (this.classList.contains('visible')) {
                this.classList.add('leave');
                // We need to clean this on close to ensure that
                // all behaves as expected on a new show.
                TARGET = null;
                if (this._resizeMethod) {
                    popup.uninstallResizeMethod(this._resizeMethod);
                    this._resizeMethod = null;
                }
            }
        }
    });

    return register('ha-tooltip', HaTooltip);
});

define('hui/validatable/validatable',[
    'object-utils/classes',
    'register-component/v2/UIComponent',
    './validators',
    '../core/popup',
    '../tooltip'
], function(classes, UIComponent, validators, popup) {
    'use strict';

    /**
     * Runs all the validations within _validators array.
     *
     * @param  {Array} validatorArray List of validations
     * @return {Object} object.isValid {Boolean}
     *                  object.message {String}
     */
    function _validate(validatorArray) {
        var result = {};
        // iterate all registered validators
        validatorArray.every(function(validator) {
            // run validator
            result = {
                isValid: validator.test(),
                message: validator.options.errorMessage,
                type: validator.validationType
            };
            // halt on first error
            return result.isValid;
        });
        // return result from last validator
        return result;
    }

    /**
     * Creates the validators indicated in the component properties.
     * @param  {HTMLElement} component Component to set the validators
     */
    function _createValidators(component) {
        var elemToValidate = component.validationTarget,
            validatorProperty,
            validatorObject,
            validator,
            currentValidator,
            validatorsMap = {
                required: {
                    errorMessage: component.requiredMessage
                },
                pattern: {
                    pattern: component.pattern
                },
                validator: {
                    validatorFunc: component.validator
                },
                min: {
                    minVal: component.min
                },
                max: {
                    maxVal: component.max
                },
                numeric: {
                    numeric: component.numeric
                },
                expected: {
                    expectedValue: component.expected
                },
                minRequired: {
                    minRequired: component.minRequired
                }
            };

        component._validators = [];
        for (validator in validatorsMap) {
            validatorObject = {
                element: elemToValidate,
                errorMessage: component.invalidMessage
            };
            currentValidator = validatorsMap[validator];
            if (component[validator]) {
                for (validatorProperty in currentValidator) {
                    validatorObject[validatorProperty] = currentValidator[validatorProperty];
                }
                component._validators.push(validators.create(validator, validatorObject));
            }
        }
    }

    /**
     * Shows/hides tooltip visibility based on show value
     * @param   {HTMLElement}   component   Component to check state
     * @param   {Boolean}       show        Whether the tooltips should be showed or hided
     */
    function _updateTooltip(component, show) {
        if (show) {
            _showValidationMessage(component);
        } else {
            if (component.tooltip) {
                component.tooltip.close();
            }
        }
    }

    /**
     * Updates the field with or without error state depending
     * on the content validity.
     * @param   {HTMLElement}   component   Component to check state
     * @param   {Boolean}       valid       Whether or not the component has a valid state
     */
    function _updateFieldState(component, valid) {
        var iconEl = component.querySelector('.hi-circle-alert'),
            title = component.querySelector('legend') || component.querySelector('label'),
            highlightElements = component.querySelectorAll(component.highlightElementSelector),
            titleParent;

        if (valid) {
            component.classList.remove('input-error');
            if (iconEl) {
                iconEl.classList.add('hide');
            }
        } else {
            component.classList.add('input-error');
            if (iconEl) {
                iconEl.classList.remove('hide');
            } else {
                if (title) {
                    titleParent = title.parentElement;
                    iconEl = document.createElement('span');
                    iconEl.className = 'hi hi-circle-alert';
                    titleParent.insertBefore(iconEl, title);
                }
            }
        }

        Array.prototype.forEach.call(highlightElements, function(element) {
            if (valid) {
                element.removeAttribute('aria-invalid');
                element.removeAttribute('aria-describedby');
            } else {
                element.setAttribute('aria-invalid', true);
            }
        });

    }

    /**
     * Displays the tooltip with the error message.
     * @param {HTMLElement} component Component which contains the validation
     */
    function _showValidationMessage(component) {
        var idForAriaAttr,
            title = component.querySelector('legend') || component.querySelector('label'),
            positions = ['top', 'bottom'],
            alignments = ['left', 'right'],
            titleElement,
            elemToValidate = component.validationTarget,
            highlightElements = component.querySelectorAll(component.highlightElementSelector),
            offset = 0,
            margin = title? -5 : 10,
            customPositioningMethods = {},
            tooltipInner,
            tooltip;

        if (!component._validationInfo) {
            return;
        }

        if (!component.tooltip) {
            //tooltip creation
            tooltip = document.createElement('ha-tooltip');
            tooltip.targetselector = '#' + elemToValidate.id;
            tooltip.trigger = 'custom';
            tooltip.position = 'top';
            tooltip.setAttribute('role', 'alert');
            component.appendChild(tooltip);
            component.tooltip = tooltip;
        }

        component.tooltip.message = component._validationInfo.message;

        //accesibility attributes setting
        tooltipInner = component.tooltip.querySelector('.tooltip-inner');
        idForAriaAttr = 'name-error-' + component.componentId;
        tooltipInner.id = idForAriaAttr;

        Array.prototype.forEach.call(highlightElements, function(element) {
            element.setAttribute('aria-describedby', idForAriaAttr);
        });

        if (component.label) {
            titleElement = component.querySelector('legend') || component.querySelector('label');
            offset = titleElement.offsetWidth + 17;
        }

        // This shouldn't be modified from outside the tooltip, but it's the only way to interrupt hiding animations from outside.
        // Without this, popup.show won't work because tooltip is still visible.
        if (component.tooltip.classList.contains('visible') && component.tooltip.classList.contains('leave')) {
            component.tooltip.classList.remove('leave');
        } else {

            customPositioningMethods.left = function _tryLeftAlignment(targetRect, childRect, currentPosition, currentPositionType) {
                function _getPageSize(elementOwnerDocument) {
                    var documentEl = elementOwnerDocument.documentElement,
                        bodyEl = elementOwnerDocument.body;

                    return {
                        width: Math.max(
                                bodyEl.scrollWidth, documentEl.scrollWidth,
                                bodyEl.offsetWidth, documentEl.offsetWidth,
                                bodyEl.clientWidth, documentEl.clientWidth
                            ),
                        height: Math.max(
                            bodyEl.scrollHeight, documentEl.scrollHeight,
                            bodyEl.offsetHeight, documentEl.offsetHeight,
                            bodyEl.clientHeight, documentEl.clientHeight
                            )
                    };
                }

                var available = _getPageSize(this.ownerDocument).width - targetRect.left,
                    finalOffset,
                    needed;

                if (currentPositionType.position === 'top') {
                    needed = childRect.width + offset;
                    finalOffset = offset;
                } else {
                    needed = childRect.width;
                    finalOffset = 0;
                }

                if (needed < available) {
                    currentPositionType.alignment = 'left';
                    currentPosition.y = targetRect.left + finalOffset;
                }
            };

            popup.show(component.tooltip, elemToValidate, positions, alignments, margin, customPositioningMethods);
            component.tooltip._resizeMethod = popup.installResizeMethod(component.tooltip, elemToValidate, positions, alignments, margin, customPositioningMethods);
        }
    }

    var Validatable = classes.createObject(UIComponent, {

        init: function _() {
            _.super(this);

            /**
             * private array that contains the validators to apply
             * @type {Array}
             */
            this._validators = null;

            /**
             * private object that contains the field validation status and message
             * coming from the validator
             * @type {Object}
             */
            this._validationInfo = null;

            /**
             * Indicates whether the field is required
             * @type {Boolean}
             */
            this.required = false;

            /**
             * Message to be displayed when a field is invalid
             * @type {String}
             */
            //this.invalidMessage = 'Invalid Value';

            /**
             * Function that can be used for validating a field
             * @type {Function}
             */
            this.validator = null;

            /**
             * Sets a minumum numeric value for a field
             * @type {Number}
             */
            this.min = null;

            /**
             * Sets a maximum numeric value for a field
             * @type {Function}
             */
            this.max = null;

            /**
             * The selector for the elements to highlight if an error is detected
             * @type {String}
             */
            this.highlightElementSelector = null;

            /**
             * The element that holds the state to be validated
             * @type {HTMLElement}
             */
            this.validationTarget = null;

            this.setupProperties({
                /**
                 * Required error message to be displayed when it participates in required validation
                 * @type {String}
                 */
                requiredMessage: {
                    default: 'Required Message',
                    type: String,
                    change: function(newValue) {
                        var validator;
                        if (Array.isArray(this._validators) && this._validators.length > 0) {
                            validator = this._validators.filter(function(item) {
                                return item.validationType === 'required';
                            });
                            // usually there is only one required validation
                            if (validator && validator[0]) {
                                validator[0].options.errorMessage = newValue;
                                // if the current component is invalid, refresh the validation info message
                                if (this._validationInfo && this._validationInfo.type === 'required') {
                                    this._validationInfo.message = newValue;
                                }
                            }
                        }
                    }
                },

                /**
                 * Invalid error message to be displayed when it participates in validations other than required
                 * @type {String}
                 */
                invalidMessage: {
                    default: 'Invalid Value',
                    type: String,
                    change: function(newValue) {
                        if (Array.isArray(this._validators) && this._validators.length > 0) {
                            this._validators.forEach(function(item) {
                                if (item.validationType !== 'required') {
                                    item.options.errorMessage = newValue;
                                }
                            });
                            // if the current component is invalid other than required validation, refresh the validation info message
                            if (this._validationInfo && this._validationInfo.type !== 'required') {
                                this._validationInfo.message = newValue;
                            }
                        }
                    }
                }
            });
        },

        /**
         * Displays the tooltip with the error message.
         * @deprecated
         */
        showValidationMessage: function() {
            console.warn('DEPRECATION WARNING: The "showValidationMessage" event is going to be deprecated. From now on, please use "reportValidity" method instead.');
            _showValidationMessage(this);
        },

        /**
         * Checks whether the component content is valid.
         * @param  {Boolean} forceTrue Optional. When true, the component and it's values are consdiered valid
         * @returns {Boolean}
         */
        checkValidity: function(forceTrue) {
            _createValidators(this);

            if (this._validators.length === 0 || forceTrue) {
                this._validationInfo = null;
                return true;
            }

            this._validationInfo = _validate(this._validators);

            return this._validationInfo.isValid;
        },

        /**
         * [handleTooltipBinding description]
         * @param  {Boolean} bind [description]
         * @return {[type]}      [description]
         */
        handleTooltipBinding: function(bind) {
            if (bind) {
                this.listenTo(this.validationTarget, 'mouseenter', this.reportValidity);
                this.listenTo(this.validationTarget, 'mouseleave', this.reportValidity);
                this.listenTo(this.validationTarget, 'blur', this.reportValidity, true);
            } else {
                this.stopListening(this.validationTarget, 'mouseenter', this.reportValidity);
                this.stopListening(this.validationTarget, 'mouseleave', this.reportValidity);
                this.stopListening(this.validationTarget, 'blur', this.reportValidity, true);
                //run a validation to update the fieldstate if necessary
                this.reportValidity();
            }

        },

        /**
         * Shows errors for invalid componentes.
         * @param  {Event} evt Optional. When defined an event triggered this call
         * @param  {Boolean} forceTrue Optional. When true, the component and it's values are consdiered valid
         * @returns {Boolean}
         */
        reportValidity: function(evt, forceTrue) {
            var valid = this._validationInfo && this._validationInfo.isValid,
                activeElement = this.ownerDocument.activeElement,
                showTooltip;

            // If no evt is present, the method was called directly and not triggered by an action
            if (!evt) {
                valid = this.checkValidity(forceTrue);
                _updateFieldState(this, valid);
                if (valid) {
                    _updateTooltip(this, false);
                }
                return valid;
            }

            switch (evt.type) {
                case 'focus':
                case 'mouseenter':
                    // If focusing or mouse enters input, there's no need to trigger validation again. It just shows tooltip if necessary
                    _updateTooltip(this, !valid);
                    break;
                case 'mouseout':
                    // If mouse leaves the input, and focus is not on the input, tooltip is hidden
                    if (activeElement !== evt.target) {
                        _updateTooltip(this, false);
                    }
                    break;
                case 'mouseleave':
                    if (!evt.target.contains(activeElement)) {
                        _updateTooltip(this, false);
                    }
                    break;
                case 'blur':
                case 'hide':
                case 'keyup':
                    valid = this.checkValidity();
                    _updateFieldState(this, valid);
                    // If evt is blur, tooltip is hidden.
                    // If event is keyup, tooltip is shown if the tooltip if invalid
                    showTooltip = (evt.type !== 'blur') && !valid;
                    _updateTooltip(this, showTooltip);
                    break;
            }

            return valid;
        }
    });

    return Validatable;
});

define('hui/radio-button-group',[
        'register-component/v2/register',
        './validatable/validatable',
        'object-utils/classes',
        './core/utils',
        './radio-button'
    ], function(register, validatable, classes, utils) {
        'use strict';

        /**
         * When a ha-radio-button is checked, updates the status of the rest to false
         * @param  {HTMLElement} component The ha-radio-button
         */
        function _uncheckRadios(component) {
            var radios = component.querySelectorAll('ha-radio-button');
            Array.prototype.forEach.call(radios, function(radio) {
                radio.checked = false;
            });
        }

        /**
         * Stops the click/change event from bubbling up and emits the one corresponding to the group, handling
         * the update of the inner radio button
         * @param  {Event} evt  The event coming from the radio-button
         * @emits HARadioButtonGroup#change
         */
        function _interceptEvent(evt) {
            var component = utils.getComponentFromElement(evt.target, 'HA-RADIO-BUTTON-GROUP');

            utils.stopEvent(evt);
            component.reportValidity(null, true);
            if (component._selectedItem !== evt.target) {
                component.value = evt.target.value;
            }
            component.emit(evt.type);
        }

        /**
         * Returns if the component has an active validation
         * @param  {HTMLElement} component The textfield
         * @return {Boolean}     true if there's at least an active validation
         */
        function validationActive(component) {
            return component.required || !!component.expected;
        }

        var HARadioButtonGroup = classes.createObject(validatable, {

            init: function _() {

                _.super(this);

                /**
                 * The currently selected ha-radio-button in radio button group
                 * @type {HTMLElement}
                 */

                this._selectedItem = null;

                /**
                 * The element that the validator will use to get the values to validate
                 * @type {HTMLElement}
                 */
                this.validationTarget = this;

                /**
                 * The selector for the elements to highlight if an error is detected
                 * @type {String}
                 */
                this.highlightElementSelector = 'input[type="radio"]';

                /**
                 * radios is the list of ha-radio-buttons that the radio button owns
                 * @type {Array}
                 */

                this._radios = null;

                /**
                 * fieldset is the property which contains the DOM element to append the group title
                 * @type {HTMLElement}
                 */

                this._fieldset = document.createElement('fieldset');

                /**
                 * legend is the property which contains the radio button group title
                 * @type {String}
                 */

                this._legend = document.createElement('label');

                this.setupProperties({

                    /**
                     * This is the name for the radio button group.
                     * @type {String}
                     */
                    name: {
                        default: 'ha-radio-button-group-' + this.componentId,
                        type: String,
                        change: function(newValue) {
                            var name;

                            name = newValue;

                            if (this.radios) {
                                this.radios.forEach(function(btn) {
                                    if (btn.name) {
                                        btn.name = name;
                                    } else {
                                        btn.setAttribute('name', name);
                                    }
                                });
                            }
                        }
                    },

                    expected: {
                        type: String,
                        default: '',
                        change: function(newValue, oldValue) {
                            if (newValue !== oldValue) {
                                this.handleTooltipBinding(validationActive(this));
                            }
                        }
                    },

                    required: {
                        type: Boolean,
                        default: false,
                        change: function(newValue, oldValue) {
                            if (newValue !== oldValue) {
                                this.handleTooltipBinding(validationActive(this));
                            }
                        }
                    },

                    /**
                     * The following property is the group title (fieldset legend actually)
                     * @type {String}
                     */
                    label: {
                        default: '',
                        type: String,
                        change: function(newValue) {
                            var fieldset = this.querySelector('fieldset'),
                                labelContainer,
                                label = fieldset.querySelector('legend');

                            if (newValue) {
                                if (!label) {
                                    label = this.ownerDocument.createElement('legend');
                                    labelContainer = this.ownerDocument.createElement('div');
                                    labelContainer.classList.add('label-container');
                                    labelContainer.appendChild(label);
                                    fieldset.insertBefore(labelContainer, fieldset.querySelector('ha-radio-button'));

                                    this.listenTo(label, 'click', function(evt) {
                                        if (evt.target.localName === 'legend') {
                                            evt.stopPropagation();
                                        }
                                    });
                                }
                                label.textContent = newValue;
                            } else {
                                if (label) {
                                    labelContainer = this.querySelector('.label-container');
                                    this.stopListening(label, 'click');
                                    fieldset.removeChild(labelContainer);
                                }
                            }
                        }
                    },

                    /**
                     * This is the current value selected of the ha-radio-button in radio button group
                     * @type {String}
                     */
                    value: {
                        default: '',
                        type: String,
                        change: function(newValue) {
                            var index,
                                btn,
                                radioNumber = this.radios ? this.radios.length : 0;
                            if (newValue) {
                                _uncheckRadios(this, newValue);
                                for (index = 0; index < radioNumber; index++) {
                                    btn = this.radios[index];
                                    if (btn.getAttribute('value') === newValue) {
                                        this._selectedItem = btn;
                                        this._selectedItem.checked = true;
                                        break;
                                    }
                                }
                            }
                        }
                    }
                });
            },

            set radios(newValue) {
                var fieldset = this.querySelector('fieldset');

                this._radios = [];
                newValue = [].slice.call(newValue);

                while (fieldset.firstChild) {
                    this.stopListening(fieldset.firstChild, 'click', _interceptEvent);
                    this.stopListening(fieldset.firstChild, 'change', _interceptEvent);
                    fieldset.removeChild(fieldset.firstChild);
                }

                newValue.forEach(function(btn) {
                    this.listenTo(btn, 'click', _interceptEvent);
                    this.listenTo(btn, 'change', _interceptEvent);
                    btn.setAttribute('name', this.name);
                    fieldset.appendChild(btn);
                    this._radios.push(btn);
                    if (btn.hasAttribute('checked') || btn.checked) {
                        this.value = btn.getAttribute('value');
                    }
                }, this);
            },

            get radios() {
                return this._radios;
            },

            /**
             * Dummy method to avoid problems with getter without setters
             */
            set selectedItem(newValue) {
                // jshint unused:false
            },

            get selectedItem() {
                return this._selectedItem;
            },

            postRender: function _() {
                var fieldset = this.querySelector('fieldset');

                if (!fieldset) {
                    fieldset = this.ownerDocument.createElement('fieldset');
                    this.appendChild(fieldset);
                    this.radios = utils.removeNodesSafe(this, this.querySelectorAll('ha-radio-button'));
                } else {
                    this.radios = Array.prototype.slice.call(fieldset.querySelectorAll('ha-radio-button'));
                }
            }
        });

        return register('ha-radio-button-group', HARadioButtonGroup);
    }
);

define('hui/switch-button',[
    'register-component/v2/UIComponent',
    'register-component/v2/register',
    './core/utils',
    'object-utils/classes'
], function(UIComponent, register, utils, classes) {

    var HASwitchbutton,

        /**
         * Hardcoded total padding (left + right) to be used if the component was created by JS.
         * [Important] CSS needs to be changed if this variable is changed.
         * @type {Number}
         */
        PADDING = 42,

        /**
         * Hardcoded font to be used if the component was created by JS.
         * [Important] CSS needs to be changed if this variable is changed.
         * @type {String}
         */
        FONT = '12px HelveticaNeueRoman,Helvetica,Arial,sans-serif';

    /**
     * Sets the width of the label to let the button knows its size.
     * @param {HTMLElement} component Element that will hold the width value.
     * @param {HTMLElement} on Element that hold the text of the on status.
     * @param {HTMLElement} off Element that hold the text of the off status.
     */
    function _setWidth(component, on, off) {
        var finalWidth, font, padding,
            onText = on.firstChild.textContent.toUpperCase(),
            offText = off.firstChild.textContent.toUpperCase();

        //we assume that the total padding and font are the same for both, on and off labels
        padding = parseInt(window.getComputedStyle(on).paddingLeft.replace('px', ''), 10) +
            parseInt(window.getComputedStyle(on).paddingRight.replace('px', ''), 10);
        font = window.getComputedStyle(on).fontSize + ' ' + window.getComputedStyle(on).fontFamily;

        // if we could not get the font from the computed styles we need to hardcode it.
        // This happens when the instantiation has been done by js and the component is not on the DOM yet.
        // "padding === 0" Added because of a bug on IE10/11.
        if (font === ' ' && isNaN(padding) || (padding === 0)) {
            font = FONT;
            padding = PADDING;
        }

        finalWidth = Math.max(utils.getTextWidth(onText, font), utils.getTextWidth(offText, font)) + 1;
        component.style.width = finalWidth + padding + 'px';
    }

    HASwitchbutton = classes.createObject(UIComponent, {

        /**
         * @emits click
         * @emits change
         */
        init: function _() {
            _.super(this);

            this.setupProperties({
                /**
                 * The default value for the checkbox "on"
                 * https://html.spec.whatwg.org/multipage/forms.html#dom-input-value-default-on
                 * @type {String}
                 */
                value: {
                    default: 'on',
                    change: function(newValue) {
                        this._nodes.input.value = newValue;
                    }
                },

                /**
                 * This is the name of the switchbutton.
                 * @type {String}
                 */
                name: {
                    default: '',
                    change: function(newValue) {
                        this._nodes.input.name = newValue;
                    }
                },

                label: {
                    default: '',
                    change: function(newValue) {
                        var label = this.querySelector('.label-div'),
                            input = this.querySelector('input'),
                            wrapper = this.querySelector('div:not(.label-div)');

                        if (newValue) {
                            if (!label) {
                                label = this.ownerDocument.createElement('div');
                                label.classList.add('label-div');
                                label.id = 'ha-switch-button-label-' + this.componentId;
                                input.setAttribute('aria-describedby', label.id);
                                this.insertBefore(label, wrapper);
                            }
                            label.textContent = newValue;
                        } else {
                            if (label) {
                                this.removeChild(label);
                                input.removeAttribute('aria-describedby');
                            }
                        }
                    }
                },

                /**
                 * This is the labelOff property for the switchbutton.
                 * @type {String}
                 */
                labelOff: {
                    default: 'OFF',
                    change: function(newValue) {
                        this._nodes.labelOff.textContent = newValue;
                        _setWidth(this._nodes.label, this._nodes.labelOn, this._nodes.labelOff);
                    }
                },

                /**
                 * This is the labelOn property for the switchbutton.
                 * @type {String}
                 */
                labelOn: {
                    default: 'ON',
                    change: function(newValue) {
                        this._nodes.labelOn.textContent = newValue;
                        _setWidth(this._nodes.label, this._nodes.labelOn, this._nodes.labelOff);
                    }
                },

                /**
                 * checked indicates if the switchbutton is checked
                 * @type {Boolean}
                 */
                checked: {
                    type: Boolean,
                    default: false,
                    change: function(newValue) {
                        this._nodes.input.checked = newValue;
                        this._nodes.input.setAttribute('aria-checked', newValue);
                    }
                }
            });
        },

        postRender: function _() {
            var wrapperEl,
                innerInput = this.querySelector('input'),
                labelOn = this.querySelector('.is-switch-on'),
                labelOff = this.querySelector('.is-switch-off'),
                label = this.querySelector('label'),
                circleButtonEl,
                ownerDocument = this.ownerDocument;

            _.super(this);

            if (!label) {
                circleButtonEl = ownerDocument.createElement('i');

                labelOff = ownerDocument.createElement('span');
                labelOff.classList.add('is-switch-off');
                labelOff.setAttribute('data-switch', 'OFF');

                labelOn = ownerDocument.createElement('span');
                labelOn.classList.add('is-switch-on');
                labelOn.setAttribute('data-switch', 'ON');

                label = ownerDocument.createElement('label');

                label.setAttribute('aria-live', 'assertive');
                label.appendChild(labelOn);
                label.appendChild(labelOff);
                label.appendChild(circleButtonEl);
            } else {
                circleButtonEl = label.querySelector('i');
            }

            if (!innerInput) {
                innerInput = ownerDocument.createElement('input');
                innerInput.type = 'checkbox';

                innerInput.appendChild(label);

                wrapperEl = ownerDocument.createElement('div');
                wrapperEl.appendChild(innerInput);
                wrapperEl.appendChild(label);
                this.appendChild(wrapperEl);
            }

            label.htmlFor = 'ha-switch-button-' + this.componentId;
            innerInput.id = 'ha-switch-button-' + this.componentId;
            labelOff.textContent = this.labelOff;
            labelOn.textContent = this.labelOn;

            this._nodes = {
                'input': innerInput,
                'label': label,
                'labelOn': labelOn,
                'labelOff': labelOff
            };

            //This is for stopping the inner element's click event.
            utils.stopNativeEvent(this, labelOn, 'click');
            utils.stopNativeEvent(this, labelOff, 'click');
            utils.stopNativeEvent(this, circleButtonEl, 'click');

            //Change listener from "change" to "click" event: regardless events registration sequence, Firefox will trigger click event first
            //and then change event, which would cause an issue in qbo data binding. Change to "click" event would resolve the issue.
            this.listenTo(innerInput, 'click', function(evt) {
                evt.stopPropagation();
                this.checked = evt.target.checked;
                this.emit('click');
            }.bind(this));

            this.listenTo(innerInput, 'change', function(evt) {
                evt.stopPropagation();
                this.emit('change');
            }.bind(this));
        }
    });

    return register('ha-switch-button', HASwitchbutton);
});

define('hui/checkbox',[
    'register-component/v2/register',
    'register-component/v2/UIComponent',
    'object-utils/classes'
], function(register, UIComponent, classes) {
    'use strict';

    var HACheckbox = classes.createObject(UIComponent, {
        init: function _() {
            _.super(this);

            this.setupProperties({
                /**
                 * name indicates the name of the checkbox
                 * type {String}
                 **/
                name: {
                    default: '',
                    change: function(newValue) {
                        this._nodes.input.name = newValue;
                    }
                },
                /**
                 * disabled indicates whether the component is enabled or disabled
                 * @type {Boolean}
                 */
                disabled: {
                    default: false,
                    type: Boolean,
                    change: function(newValue) {
                        this._nodes.input.disabled = newValue;
                    }
                },
                /**
                 * checked indicates if the checkbox is checked
                 * @type {Boolean}
                 */
                checked: {
                    default: false,
                    type: Boolean,
                    change: function(newValue) {
                        if (this._nodes.input.checked !== newValue) {
                            this._nodes.input.checked = newValue;
                        }
                        this.emit('change');
                    }
                },
                /**
                 * The default value for the checkbox "on"
                 * https://html.spec.whatwg.org/multipage/forms.html#dom-input-value-default-on
                 * @type {String}
                 */
                value: {
                    default: 'on',
                    change: function(newValue) {
                        this._nodes.input.value = newValue;
                    }
                },
                /**
                 * This is the label property for the checkbox.
                 * @type {String}
                 */
                label: {
                    default: '',
                    change: function(newValue) {
                        var label = this._nodes.label;

                        label.textContent = newValue;
                        if (!newValue) {
                            this.removeAttribute('label');
                        }
                    }
                },
                /**
                 * This is the indeterminate property for the checkbox
                 * @type {Boolean}
                 */
                indeterminate: {
                    default: false,
                    type: Boolean,
                    change: function(newValue) {
                        var checkbox = this.querySelector('input');
                        checkbox.indeterminate = newValue;
                    }

                }
            });
        },

        postRender: function _() {
            _.super(this);

            this._nodes = {};

            var input = this.querySelector('input'),
                label,
                id;

            if (!input) {
                input = this.ownerDocument.createElement('input');
                input.type = 'checkbox';
                this.appendChild(input);
            }
            id = 'ha-checkbox-' + this.componentId;
            input.id = id;
            this._nodes.input = input;

            label = this.querySelector('label');
            if (!label) {
                label = this.ownerDocument.createElement('label');
                this.appendChild(label);
            }
            label.htmlFor = id;
            this._nodes.label = label;

            //Change listener from "change" to "click" event: regardless events registration sequence, Firefox will trigger click event first
            //and then change event, which would cause an issue in qbo data binding. Change to "click" event would resolve the issue.
            this.listenTo(input, 'click', function(evt) {
                evt.stopImmediatePropagation();
                this.checked = evt.target.checked;
                this.emit('click');
            }.bind(this));

            //This event listeners are created for preventing the change and click events to bubble up.
            this.listenTo(input, 'change', function(evt) {
                evt.stopPropagation();
            }.bind(this));

            //This event listeners are created for preventing the change and click events to bubble up.
            this.listenTo(label, 'click', function(evt) {
                evt.stopPropagation();
            });
        }
    });

    return register('ha-checkbox', HACheckbox);
});
define('hui/checkbox-group',[
        'register-component/v2/register',
        './validatable/validatable',
        'object-utils/classes',
        './core/utils',
        './checkbox'
    ], function(register, Validatable, classes, utils) {
        'use strict';

        /**
         * Stops the click event from bubbling up and emits the one corresponding to the group
         * @param  {Event} evt  The event coming from the radio-button
         * @emits HARadioButtonGroup#click
         */
        function _interceptClickEvent(evt) {
            var component = utils.getComponentFromElement(evt.target, 'HA-CHECKBOX-GROUP');

            utils.stopEvent(evt);
            component.emit(evt.type);
        }

        function _updateState(component, checkbox) {
            var index = component._value.indexOf(checkbox.value);
            if (checkbox.checked) {
                if (index === -1) {
                    component._value.push(checkbox.value);
                    component._selectedItems.push(checkbox);
                    component.reportValidity(true);
                }
            } else if ((component._value) && (index !== -1)) {
                component._value.splice(index, 1);
                component._selectedItems.splice(index, 1);
            }
            component.reportValidity(null, true);
        }

        /**
         * Stops the change event from bubbling up and emits the one corresponding to the group, handling
         * the update of the inner radio button
         * @param  {Event} evt  The event coming from the radio-button
         * @emits HARadioButtonGroup#change
         */
        function _interceptChangeEvent(evt) {
            var component = utils.getComponentFromElement(evt.target, 'HA-CHECKBOX-GROUP');

            utils.stopEvent(evt);
            _updateState(component, evt.target);
            component.emit(evt.type);
        }

        var HACheckboxGroup = classes.createObject(Validatable, {

            init: function _() {

                _.super(this);

                /**
                 * The currently selected ha-radio-button in radio button group
                 * @type {HTMLElement}
                 */
                this._selectedItems = [];

                /**
                 * This is the list of current value selected in checkbox group.
                 * @type {Array}
                 */
                this._value = [];

                /**
                 * List of ha-checkbox that the checkbox group owns.
                 * @type {Array}
                 */
                this._checkboxes = [];

                /**
                 * The element that the validator will use to get the values to validate
                 * @type {HTMLElement}
                 */
                this.validationTarget = this;

                /**
                 * The selector for the elements to highlight if an error is detected
                 * @type {String}
                 */
                this.highlightElementSelector = 'input[type="checkbox"]';

                this.setupProperties({

                    /**
                     * This is the name for the checkbox button group.
                     * @type {String}
                     */
                    name: {
                        default: 'ha-checkbox-group-' + this.componentId,
                        type: String,
                        change: function(newValue) {
                            if (this._checkboxes.length > 0) {
                                this._checkboxes.forEach(function(checkbox) {
                                    if (checkbox.name) {
                                        checkbox.name = newValue;
                                    } else {
                                        checkbox.setAttribute('name', newValue);
                                    }
                                });
                            }
                        }
                    },

                    /**
                     * This is the optional label of the checkbox group.
                     * @type {String}
                     */
                    label: {
                        default: '',
                        type: String,
                        change: function(newValue) {
                            var fieldset = this.querySelector('fieldset'),
                                labelContainer,
                                label = this.querySelector('legend');

                            if (newValue) {
                                if (!label) {
                                    label = this.ownerDocument.createElement('legend');
                                    labelContainer = this.ownerDocument.createElement('div');
                                    labelContainer.classList.add('label-container');
                                    labelContainer.appendChild(label);
                                    fieldset.insertBefore(labelContainer, fieldset.firstChild);

                                    this.listenTo(label, 'click', function(evt) {
                                        if (evt.target.localName === 'legend') {
                                            evt.stopPropagation();
                                        }
                                    });
                                }
                                label.textContent = newValue;
                            } else if (label) {
                                labelContainer = this.querySelector('.label-container');
                                this.stopListening(label, 'click');
                                fieldset.removeChild(labelContainer);
                            }
                        }
                    },

                    minRequired: {
                        default: 0,
                        type: Number,
                        change: function(newValue, oldValue) {
                            if (newValue !== oldValue) {
                                this.handleTooltipBinding(newValue || this.required);
                            }
                        }
                    },

                    required: {
                        type: Boolean,
                        default: false,
                        change: function(newValue, oldValue) {
                            if (newValue !== oldValue) {
                                this.handleTooltipBinding(newValue || this.minRequired);
                            }
                        }
                    }
                });
            },

            set value(newValue) {
                this._value.length = 0;
                this._selectedItems.length = 0;

                if (newValue) {
                    newValue.forEach(function(value) {
                        this._checkboxes.forEach(function(checkbox) {
                            if (value === checkbox.value) {
                                this._selectedItems.push(checkbox);
                                this._value.push(value);
                                checkbox.checked = true;
                            } else if (this._value.indexOf(checkbox.value) === -1) {
                                checkbox.checked = false;
                            }
                        }.bind(this));
                    }.bind(this));
                }
            },

            get value() {
                return this._value;
            },

            set checkboxes(newValue) {
                var fieldset = this.querySelector('fieldset');

                this._checkboxes.length = 0;

                while (fieldset.lastChild && fieldset.lastChild.localName !== 'legend') {
                    this.stopListening(fieldset.lastChild, 'click', _interceptClickEvent);
                    this.stopListening(fieldset.lastChild, 'change', _interceptChangeEvent);
                    fieldset.removeChild(fieldset.lastChild);
                }

                if (newValue) {
                    newValue = [].slice.call(newValue);

                    newValue.forEach(function(checkbox) {
                        this.listenTo(checkbox, 'click', _interceptClickEvent);
                        this.listenTo(checkbox, 'change', _interceptChangeEvent);
                        fieldset.appendChild(checkbox);
                        this._checkboxes.push(checkbox);
                        _updateState(this, checkbox);
                    }, this);
                }
            },

            get checkboxes() {
                return this._checkboxes;
            },

            /**
             * Dummy method to avoid problems with getter without setters
             */
            set selectedItems(newValue) {
                // jshint unused:false
            },

            get selectedItems() {
                return this._selectedItems;
            },

            postRender: function _() {
                _.super(this);

                var elements = this.querySelectorAll('ha-checkbox'),
                    fieldset = this.querySelector('fieldset'),
                    checkboxesParent = fieldset || this;

                if (!fieldset) {
                    fieldset = this.ownerDocument.createElement('fieldset');
                    this.appendChild(fieldset);
                }

                if (elements.length > 0) {
                    elements = utils.removeNodesSafe(checkboxesParent, elements);
                    this.checkboxes = elements;
                }
            }
        });

        return register('ha-checkbox-group', HACheckboxGroup);
    }
);

/**
 * Plugin that loads a template from a specified module id and returns a function to
 * generate DOM corresponding to that template. Uses Mustache.
 *
 * When that function is run, it returns another function.
 *
 * Template has a format like:
 *
 * ```html
 * <button>
 *   <span class="ha-reset {{iconClass}}"></span>
 *   {{label}}
 * </button>
 * ```
 *
 * Usage is typically like:
 *
 * ```js
 * define([..., "register-component/template!./templates/MyTemplate.html"], function(..., template) {
 *     ...
 *     template: template,
 *     ...
 * });
 * ```
 *
 * @module register-component/template
 */
define('register-component/template',["mustache"], function(Mustache) {

    var buildMap = {},

        // Text plugin to load the templates and do the build.
        textPlugin = "text";

    return { /** @lends module:register-component/template */
        /**
         * Returns a function to generate the DOM specified by the template.
         * This is the function run when you use this module as a plugin.
         * @param {string} mid - Absolute path to the resource.
         * @param {Function} require - AMD's require() method.
         * @param {Function} onload - Callback function which will be called with the compiled template.
         * @param {Object} config - Configuration object from the loader with `isBuild === true`
         * when doing a build.
         * @private
         */
        load: function(mid, require, onload, config) {
            if (buildMap[mid]) {
                onload(buildMap[mid]);
            } else {
                var textOnload;

                textOnload = function(source) {
                    if (config && config.isBuild) {
                        // Don't bother doing anything else during build.
                        onload();
                    } else {
                        Mustache.parse(source);
                        buildMap[mid] = function(data) {
                            return Mustache.render(source, data);
                        };

                        onload(buildMap[mid]);
                    }
                };

                require([textPlugin + "!" + mid], textOnload);
            }
        }
    };
});

define('text!hui/drawer/drawer-large.html',[],function () { return '<template>\n    <aside class="drawer-panel" aria-labelledby="drawer-large-title-{{componentId}}" tabindex="-1">\n        <header class="header">\n            <button class="drawer-close first-focus" aria-label="close">\n                <span class="hi hi-close"></span>\n            </button>\n        </header>\n        <section class="content" tabindex="-1">\n            <h3 id="drawer-large-title-{{componentId}}">\n            </h3>\n            <div class="inner-content"></div>\n        </section>\n        <footer class="footer" tabindex="-1"></footer>\n    </aside>\n\n</template>\n';});


define('hui/core/a11y',[
    './keys'
], function(keys) {

    /**
     * Stops the event.
     * @param {HTMLElement} evt
     */
    function _stopEvt(evt) {
        evt.stopPropagation();
        evt.preventDefault();
    }

    /**
     * Handler for the first focusable element onBlur.
     * When we detect that the first focusable element has lost the focus
     * we force it to be on the component wrapper.
     * @param {KeyboardEvent} event
     * @param {HAPopover} component
     */
    function _firstElementKeydownHandler(event, component) {
        if (event.shiftKey) {
            component.focus();
        }
    }

    /**
     * Handler for the last focusable element onBlur.
     * When we detect that the last focusable element has lost the focus
     * we force it to be the on component wrapper.
     * @param {KeyboardEvent} event
     * @param {HAPopover} component
     */
    function _lastElementBlurKeydownHandler(event, component) {
        if (!event.shiftKey) {
            component.focus();
        }
    }

    /**
     * Return the indexTab of the element, considering native elements focusable.
     * @param {HTMLElement} elem that contain the indexTab attribute.
     * @returns {Number} return the TabIndex value of current element, if don't have one
     * will return undefined.
     * @private
     */
    function _getTabIndex(elem) {
        if (elem.hasAttribute('tabIndex')) {
            return +elem.getAttribute('tabIndex');
        } else {
            return _elementsFocusable.indexOf(elem.tagName) > -1 ? 0 : undefined;
        }
    }

    /**
     * Returns if the element is hidden
     * @param  {HTMLElement}  elem The element
     * @param {HTMLElement} component - Component Element
     * @return {Boolean} True if the element is hidden
     */
    function _isHidden(elem, component) {
        var isHidden,
            styles;
        if (component) {
            isHidden = false;
            do {
                isHidden = elem.style.display === 'none' || elem.style.visibility === 'hidden';
                elem = elem.parentElement;
            } while (elem && elem !== component && !isHidden);
            return isHidden;
        } else {
            styles = window.getComputedStyle(elem);
            return ((styles.display && styles.display === 'none') || (styles.visibility && styles.visibility === 'hidden'));
        }
    }

    var _elementsFocusable = [
            'INPUT',
            'SELECT',
            'BUTTON',
            'TEXTAREA',
            'A',
            'AREA',
            'OBJECT'
        ],

        a11y = {
            /**
             * Given a component returns the first and (optionally) the last
             * focusable element.
             * Focusable is interpreted as any element that has a tabIndex > -1.
             *
             * @param {HTMLElement} component The component to inspect.
             * @param {Boolean} last If we need the last child or not.
             * @return {Object} object.first {HTMLElement}
             *                  object.last {null || HTMLElement}
             */
            getBoundariesTabableElement: function(component, last) {
                var elements = {},
                    i = 0,
                    innerElements = component.querySelectorAll('*');

                elements.first = null;
                for (i; null === elements.first && i < innerElements.length; ++i) {
                    if (innerElements[i] && this.isTabNavigable(innerElements[i], component)) {
                        elements.first = innerElements[i];
                    }
                }

                elements.last = null;
                if (last) {
                    i = innerElements.length - 1;
                    for (i; null === elements.last && i > 0; --i) {
                        if (innerElements[i] && this.isTabNavigable(innerElements[i], component)) {
                            elements.last = innerElements[i];
                        }
                    }
                }

                return elements;
            },

            _getFirstTabable: function(component) {
                var innerElements = component.querySelectorAll('*'),
                    element,
                    i;

                element = null;
                for (i = 0; i < innerElements.length; ++i) {
                    if (this.isTabNavigable(innerElements[i])) {
                        element = innerElements[i];
                        break;
                    }
                }

                return element;
            },

            _getFirstFocusable: function(component) {
                var innerElements = component.querySelectorAll('*'),
                    element,
                    i;

                element = null;
                for (i = 0; i < innerElements.length; ++i) {
                    if (this.isFocusable(innerElements[i])) {
                        element = innerElements[i];
                        break;
                    }
                }

                return element;
            },

            /**
             * Return if the element is tabable or not.
             * @param {HTMLElement} elem that will be validated.
             * @param {HTMLElement} component - Component Element
             * @returns {Boolean}
             */
            isTabNavigable: function(elem, component) {
                return !elem.disabled && !_isHidden(elem, component) && _getTabIndex(elem)  >= 0;
            },

            /**
             * Return if the element is focusable or not.
             * @param {HTMLElement} elem that will be validated.
             * @returns {Boolean}
             */
            isFocusable: function(elem) {
                return !elem.disabled && !_isHidden(elem) && _getTabIndex(elem) >= -1;
            },

            /**
             * Keeps the focus inside the element while using the TAB.
             * @param {KeyboardEvent} evt
             * @param {HTMLElement} component The component to inspect.
             */
            keepFocusInsideListener: function(evt, component) {
                var elements,
                    target;

                if (evt.keyCode === keys.TAB) {
                    elements = this.getBoundariesTabableElement(component, true);
                    target = evt.target;

                    // If first and last elements are equal, we should not stop the propagation
                    // because if we do, the focus never is going to leave that element.
                    // The component wrapper could be also empty so we need to check if the getBoundariesTabableElement
                    // has returned somethign or not.
                    if (elements.first && elements.last) {

                        // If the shiftKey was pressed along with the tab, we need to move back.
                        if (evt.shiftKey) {

                            // If the the target is the first focusable element, the focus needs to go
                            // to the component wrapper according with what we agreed with @TedDrake.
                            if (target === elements.first) {
                                _stopEvt(evt);
                                _firstElementKeydownHandler(evt, component);

                                // Similary if the target is the component, we need to go back to the last
                                // focusable element.
                            } else if (target === component) {
                                _stopEvt(evt);
                                elements.last.focus();
                            }

                            // Target is the last focusable element and shiftKey wasn't pressed, so the focus needs
                            // to go to the component wrapper.
                        } else if (target === (elements.last)) {
                            _stopEvt(evt);
                            _lastElementBlurKeydownHandler(evt, component);
                        }
                    } else {
                        _stopEvt(evt);
                        _lastElementBlurKeydownHandler(evt, component);
                    }
                }
            },

            /**
             * Sets the focus to first input or focusable element.
             * Ussually this will be called from the components show method.
             * @param {HTMLElement} component The component to inspect.
             */
            setFocusOnFirst: function(component) {
                var elements = this.getBoundariesTabableElement(component);

                if (elements.first) {
                    elements.first.focus();
                }
            },

            /**
             * Sets the focus to first tabable element. If there isn't any,
             * sets focus on first focusable element
             * @param {HTMLElement} component The component to inspect.
             * @return {HTMLElement} The element that was found
             */
            setFocusOnAnyFirst: function(component) {
                var element;

                element = this._getFirstTabable(component) ||  this._getFirstFocusable(component);

                if (element) {
                    element.focus();
                }

                return element;
            },

            /**
             * Set focus on any previous sibling if any of them is focusable.
             * Otherwise, it sets focus on parent element, taking into account if it's focusable or not,
             * in the last case adding a class to hide any potential outline
             * @param  {HTMLElement} component Reference component to find siblings
             */
            setFocusOnPreviousElement: function(component) {
                var parent = component.parentElement,
                    previousSibling = component.previousElementSibling;

                while (previousSibling) {
                    if (this.isFocusable(previousSibling) && !_isHidden(previousSibling)) {
                        previousSibling.focus();
                        return;
                    }
                    previousSibling = previousSibling.previousElementSibling;
                }

                if (this.isFocusable(parent)) {
                    parent.focus();
                    return;
                } else {
                    //We force focusable
                    parent.classList.add('hidden-focus-style');
                    parent.setAttribute('tabindex', -1);
                    parent.focus();
                }

            }
        };

    return a11y;
});

define('hui/drawer/DrawerBase',[
    '../core/a11y',
    '../core/keys',
    '../core/utils',
    'register-component/v2/UIComponent',
    'object-utils/classes'
], function(a11y, keys, utils, UIComponent, classes) {
    'use strict';

    /**
     * Inserts the title in the rendered component
     * @param {HTMLElement} component The Drawer
     * @param {String} title   The title text
     */
    function setTitle(component, title) {
        var titleEl = component.querySelector('.content').querySelector('h3');
        if (titleEl) {
            titleEl.textContent = title;
        }
    }

    var DrawerBase = classes.createObject(UIComponent, {

        init: function _() {

            _.super(this);
            /**
             * Used for accesibility reasons to set the focus to the last active element
             * before the Drawer appeareanse.
             * @private
             * @type {HTMLElement}
             */
            this._lastFocus = null;

            /**
             * Indicates whether the component is visible after calling show
             * @private
             * @type {Boolean}
             */
            this._open = false;

            this.setupProperties({
                /**
                 * A string that the consumer can set as an atributte/property
                 * which is going to be displayed on the Drawer as a Title.
                 * @type {String}
                 */
                titleText: {
                    default: '',
                    change: function(newValue) {
                        setTitle(this, newValue);
                    }
                }
            });

            this.on('show', function(evt) {
                if ((evt.target.localName === 'ha-drawer-large' || evt.target.localName === 'ha-drawer-small') && this._open && evt.type === 'show') {
                    // here we send the content of the drawer instead of the drawer itself, because
                    // we want to avoid focusing the close button
                    a11y.setFocusOnFirst(this.querySelector('.content'));
                }
            });

            /**
             * @emits dismiss.
             */
            this.on('keydown', function(evt) {
                if (keys.ESCAPE === evt.keyCode) {
                    utils.stopEvent(evt);
                    this.emit('dismiss');
                    this.close();
                } else {
                    a11y.keepFocusInsideListener(evt, this);
                }
            });
        },

        /**
         * @deprecated. The 'close' method should be used instead
         */
        hide: function() {
            console.warn('DEPRECATION WARNING: The "hide" method is going to be deprecated. From now on, please use the "close" method instead.');
            this.close();
        },

        /**
         * Callback attached after the Component render
         * Here we check if the element was already rendered, if not we render it for the first time.
         * If it was rendered, we check if some property has change to apply the visual changes.
         */
        postRender: function _() {
            _.super(this);
            //Setting up things related to accesibility
            this.tabIndex = -1;
            this.role = 'dialog';

        },

        /**
         * This method must be removed, once the hide method is also removed.
         */
        addEventListener: function _() {
            HTMLElement.prototype.addEventListener.apply(this, arguments);
            if (arguments[0] === 'hide') {
                console.warn('DEPRECATION WARNING: The hide event is going to be deprecated. From now on, please use "close" instead.');
            }
        },

        /**
         * Fill the given section content with the consumer information.
         * @param {HTMLElement} component that have the context that was invoked.
         * @param {String} attribute that will be upgraded with the new content.
         * @param {String} targetChild represent the child location to be filled with the new content
         * @param {Array} newValues a list of new content of the consumer.
         * @private
         */
        _fillSection: function(component, attribute, targetChild, newValues) {
            var section = component.querySelector(targetChild);

            if (component[attribute]) {
                component[attribute].forEach(function(item) {
                    section.removeChild(item);
                });
            }

            if (!newValues) {
                component[attribute] = null;
                return;
            }
            if (Array.isArray(newValues)) {
                component[attribute] = newValues;
                newValues.forEach(function(elem) {
                    section.appendChild(elem);
                });
            } else {
                component[attribute] = [newValues];
                section.appendChild(newValues);
            }
        },

        createdCallback: function _() {
            _.super(this);
        }
    });

    return DrawerBase;
});


define('hui/core/underlay',[
    './a11y'
],
function(a11y) {
    'use strict';

    var setFocusMethod,
        Underlay;

    Underlay = {
        /**
         * Add underlay to the body and shows it
         * @param {HTMLElement} component The component that needs to set an underlay
         */
        show: function(component) {
            var bodyEl = document.body,
                underlayElement = bodyEl.querySelector('.ha-underlay'),
                htmlElement;
            if (!underlayElement) {
                htmlElement = document.createElement('div');
                htmlElement.classList.add('ha-underlay');
                htmlElement.tabIndex = -1;
                bodyEl.appendChild(htmlElement);
                setFocusMethod = function() {
                    a11y.setFocusOnFirst(this);
                }.bind(component);
                htmlElement.addEventListener('focus', setFocusMethod);
            }
        },

        /**
         * Hides the underlay and removes the component from the body
         */
        hide: function() {
            var _animationend = 'webkitAnimationName' in document.documentElement.style ? 'webkitAnimationEnd' : 'animationend',
                bodyEl = document.body,
                underlayElement = bodyEl.querySelector('.ha-underlay');
            if (underlayElement && !underlayElement.classList.contains('fade-out')) {
                bodyEl.addEventListener(_animationend, function onHide() {
                    bodyEl.removeEventListener(_animationend, onHide);
                    underlayElement.removeEventListener('focus', setFocusMethod);
                    setFocusMethod = null;
                    bodyEl.removeChild(underlayElement);
                });
                underlayElement.classList.add('fade-out');
            }
        },

        /**
         * Set desired z-index to the underlay
         * @param {Number} zIndex Value of z-index to set to the overlay
         */
        setZIndex: function(zIndex) {
            var underlayElement = document.body.querySelector('.ha-underlay');
            if (underlayElement) {
                underlayElement.style.zIndex = zIndex;
            }
        }
    };

    return Underlay;
});

define('hui/core/contentNode',[
], function() {
    'use strict';

    /**
     * The ContentNode provide us the ability to get from the HTML that the consumer
     * inputs the childNodes and place them into the corresponding place.
     * The mapping is being doing from the tag that wraps the content.
     * The basic interface convention is:
     *     <header></header>
     *     <main></main>
     *     <footer></footer>
     *
     * Then, each component takes those nodes and maps them to a property, as an array.
     * This mapping is done in a hash called 'ContentPropertyMap'.
     * For instance:
     *     ContentPropertyMap: {
     *         'header': 'titleText';
     *         'main': 'content',
     *         'footer': 'buttons'
     *     }
     */

    /**
     * Must be called before the template is rendered. Takes the content within the contentSelectors
     * and saves them to be applied later on the postRender, where the template is already in place.
     * @param  {HTMLElement}    component           Component to apply the mapping
     * @param  {Object}         contentPropertyMap  Mapping between HTML and properties
     * @param  {Object}         transformations     Optional. Map of transformations to apply to HTML content
     */
    function cacheInputContent(component, contentPropertyMap, transformations) {
        var key;

        if (contentPropertyMap && component.childNodes && component.childNodes.length) {
            component._cachedChildNodes = {};

            for (key in contentPropertyMap) {
                if (contentPropertyMap.hasOwnProperty(key) && component.querySelector(key)) {
                    _parse(component, component.querySelector(key), key, transformations);
                }
            }
        }
    }

    /**
     * Parse will apply some transformations to the input template if defined in the child component
     * If no transformation is defined in the child component, it will return the unchanged fragment
     * @param  {HTMLElement}    component           Component to apply the transformations
     * @param  {HTMLElement}    htmlFragment        The fragment to be transformed or not
     * @param  {String}         targetSelector      The selector to identify the target
     * @param  {Object}         transformations     Optional. Map of transformations to apply to HTML content
     */
    function _parse(component, htmlFragment, targetSelector, transformations) {
        var parsedFragment;
        if (transformations && transformations.hasOwnProperty(targetSelector)) {
            parsedFragment = transformations[targetSelector](component, htmlFragment, targetSelector);
            component._cachedChildNodes[targetSelector] = parsedFragment;
        } else {
            component._cachedChildNodes[targetSelector] = htmlFragment.parentElement.removeChild(htmlFragment);
        }
    }

    /**
     * If there was something on the input HTML to import into the Component template,
     * we should move it to the property that the ContentPropertyMap specifies,
     * and let the setter of the property update the content.
     * Then, we clean the cachedChildNodes so they are not accesible from the Component node.
     * @param  {HTMLElement}    component           Component to apply the mapping
     * @param  {Object}         contentPropertyMap  Mapping between HTML and properties
     */
    function storeCachedInput(component, contentPropertyMap) {
        var key,
            target;

        if (component._cachedChildNodes) {
            for (key in component._cachedChildNodes) {
                if (component._cachedChildNodes.hasOwnProperty(key)) {
                    target = contentPropertyMap[key];
                    component[target] = [].slice.call(component._cachedChildNodes[key].childNodes);
                }
            }

            delete component._cachedChildNodes;
        }
    }

    /**
     * Public method to add content.
     * @param {HTMLElement}   component           Component to add the content
     * @param {Object}        contentConfig       Could be a node or a list of nodes.
     * @param {Object}        contentPropertyMap  Mapping between HTML and properties
     * @deprecated
     */
    function addContent(component, contentConfig, contentPropertyMap) {
        var target,
            key,
            warningMessage;

        for (key in contentConfig) {
            if (contentConfig[key] && contentPropertyMap.hasOwnProperty(key)) {
                target = contentPropertyMap[key];
                if (Array.isArray(contentConfig[key])) {
                    component[target] = contentConfig[key];
                } else {
                    component[target] = [contentConfig[key]];
                }
            }
        }
        warningMessage = 'DEPRECATION WARNING: addContent method should not be used anymore to add ' +
            'content to the component. This will be removed in the future so please assign content ' +
            'directly to the corresponding component properties instead.';
        console.warn(warningMessage);
    }

    return {
        cacheInputContent: cacheInputContent,
        storeCachedInput: storeCachedInput,
        addContent: addContent
    };
});

define('hui/drawer-large',[
    'register-component/v2/register',
    'register-component/template!./drawer/drawer-large.html',
    './drawer/DrawerBase',
    './core/underlay',
    'object-utils/classes',
    './core/contentNode',
    './core/utils'
], function(register, template, DrawerBase, Underlay, classes, contentNode, utils) {
    'use strict';
    /**
     * Map that says where to insert the content that the consumer sends on the initialization.
     * NOTE: main section exist for backward compatibility.
     * @private
     * @type {Object}
     */
    var _contentPropertyMap = {
            'section': 'section',
            'main': 'section',
            'footer': 'footer'
        },
        HADrawerLarge;

    HADrawerLarge = classes.createObject(DrawerBase, {

        init: function _() {
            _.super(this);

            // Fix for cloning. It's the only way to retrieve original content
            var innerContent = this.querySelector('section .inner-content'),
                animationEvts = utils.getAnimationEventNames();

            if (innerContent) {
                this.querySelector('section').innerHTML = innerContent.innerHTML;
            }

            this._footer = null;

            this._section = null;

            this.template = template;

            this.setupProperties({
                /**
                 * Indicates whether or not the Drawer needs to have a full
                 * screen overlay with opacity.
                 * @type {Boolean}
                 */
                backdrop: {
                    default: false,
                    type: Boolean
                },
                /**
                 * @deprecated 'backdrop' should be used instead
                 * @type {Boolean}
                 */
                overlay: {
                    default: false,
                    type: Boolean,
                    change: function(newValue, oldValue) {
                        if (newValue !== oldValue) {
                            this.backdrop = newValue;
                            console.warn('DEPRECATION WARNING: The "overlay" property is going to be deprecated. From now on, please use the "backdrop" property instead.');
                        }
                    }
                }
            });

            contentNode.cacheInputContent(this, _contentPropertyMap);

            /**
             * @emits dismiss.
             */
            this.on('button.drawer-close:click', function() {
                this.emit('dismiss');
                this.close();
            }.bind(this));

            //Listener for removing show class after ha-drawer-slide-out is completed
            this.on(animationEvts.animationend, function(ev) {
                if (ev.animationName === 'ha-drawer-slide-out') {
                    this.classList.remove('show');
                }
            }.bind(this));
        },

        get footer() {
            return this._footer;
        },

        set footer(newFooter) {
            this._fillSection(this, '_footer', 'footer', newFooter);
        },

        get section() {
            return this._section;
        },

        set section(newSection) {
            this._fillSection(this, '_section', 'section .inner-content', newSection);
        },

        /**
         * Opens the Drawer, and makes the elements inside to be accessible from the keyboard.
         * @emits show
         */
        show: function() {
            if (!this._open) {
                this._open = true;

                // making elements inside the Drawer visible for the keyboard
                // the show class makes the drawer visible in order to execute the corresponding animations
                this.classList.add('show');
                this.classList.remove('slide-out');
                // We need a timeout here because on IE the addition of show class is taking a long time
                // and it seems that the element is being rendered by parts
                setTimeout(function() {
                    this.classList.add('slide-in');
                }.bind(this), 25);

                if (this.backdrop) {
                    Underlay.show(this);
                    this.ownerDocument.body.classList.add('overflow-hidden');
                    // adding a class to the html tag does not work, we need to add the style inline
                    this.ownerDocument.documentElement.style.overflow = 'hidden';
                }

                this._lastFocus = this.ownerDocument.activeElement;

                this.emit('show');
            }
        },

        /**
         * Closes the Drawer, and remove the elements inside from the keyboard access.
         * @emits close
         * @emits hide - for backward compatibility
         */
        close: function() {
            if (this._open) {
                this._open = false;
                this.classList.remove('slide-in');
                this.classList.add('slide-out');

                // remove backdrop if we have one
                if (this.backdrop) {
                    Underlay.hide();
                    this.ownerDocument.documentElement.style.overflow = 'auto';
                    this.ownerDocument.body.classList.remove('overflow-hidden');
                }

                // restore focus to last active element before drawer was opened
                if (this._lastFocus) {
                    this._lastFocus.focus();
                }

                this._lastFocus = null;

                this.emit('close');
                this.emit('hide'); // for backward compatibility
            }
        },

        postRender: function _() {
            _.super(this);
            contentNode.storeCachedInput(this, _contentPropertyMap);
        },

        /**
         * Adds content to the component
         * @param {object} config Mapping between HTML and properties
         * @deprecated Properties should be used directly instead
         */
        addContent: function(config) {
            contentNode.addContent(this, config, _contentPropertyMap);
        }
    });

    return register('ha-drawer-large', HADrawerLarge);
});


define('text!hui/drawer/drawer-small.html',[],function () { return '<template>\n    <button class="btn-toggle drawer-hide first-focus" aria-label="close">\n        <i class="hi hi-chevron-left drawer-arrow"></i>\n        <i class="hi hi-chevron-right drawer-arrow"></i>\n    </button>\n    <section class="content">\n        <h3 id="drawer-small-title-{{componentId}}"></h3>\n        <div class="inner-content"></div>\n    </section>\n</template>\n';});


define('hui/drawer-small',[
    'register-component/v2/register',
    'register-component/template!./drawer/drawer-small.html',
    './drawer/DrawerBase',
    'object-utils/classes',
    './core/contentNode'
], function(register, template, DrawerBase, classes, contentNode) {
    'use strict';

    function _setContentHeight(drawer) {
        var doc = drawer.ownerDocument,
            docHeight = Math.max(
                doc.body.scrollHeight, doc.documentElement.scrollHeight,
                doc.body.offsetHeight, doc.documentElement.offsetHeight,
                doc.body.clientHeight, doc.documentElement.clientHeight
            ),
            contentHeight = docHeight - drawer.offsetTop + 'px';

        drawer.querySelector('.content').style.height = contentHeight;
    }

    /**
     * This method is used to toggle the visiblity of the Drawer
     */
    function _toggle() {
        /*jshint validthis:true */
        if (this._open) {
            this.close();
        } else {
            this.show();
        }
    }

    function _setTargetSibling(component, targetSelector, prevTargetSelector) {
        var parent = component.parentElement,
            prevTarget,
            target;

        if (parent) {
            if (prevTargetSelector !== undefined && prevTargetSelector !== '') {
                prevTarget = parent.querySelector('.ha-flex-flexible');
            } else {
                prevTarget = component.previousElementSibling;
            }

            if (prevTarget) {
                prevTarget.classList.remove('ha-flex-flexible');
            }
        }

        if (targetSelector) {
            target = component.ownerDocument.querySelector(targetSelector) || component.previousElementSibling;
        } else {
            target = component.previousElementSibling;
        }

        if (target) {
            target.classList.add('ha-flex-flexible');
        }
    }

    /**
     * Map that says where to insert the content that the consumer sends on the initialization.
     * NOTE: main section exist for backward compatibility.
     * @type {Object}
     * @private {Object}
     */
    var _contentPropertyMap = {
            'section': 'section',
            'main': 'section'
        },

        /**
         * We save a reference to the previous parent node, since the consumer could
         * direclty append the component into another place without removing. This makes the detachedCallback
         * happen when this.parentElement is the new parent, and we cannot do the clean up.
         * @type {HTMLElement}
         */
        _previousParentNode = null,

        HADrawerSmall = classes.createObject(DrawerBase, {

            init: function _() {
                _.super(this);

                /**
                 * The section content of drawer.
                 * @type {Array}
                 */
                this._section = null;

                this.template = template;

                this.setupProperties({
                    /**
                     * Defines the previous sibling element to which the ha-flex-flexible class will be added.
                     * @type String
                     */
                    targetSiblingSelector: {
                        default: '',
                        type: String,
                        change: function(newValue, oldValue) {
                            _setTargetSibling(this, newValue, oldValue);
                        }
                    }
                });

                // Fix for cloning. It's the only way to retrieve original content
                var innerContent = this.querySelector('section .inner-content');
                if (innerContent) {
                    this.querySelector('section').innerHTML = innerContent.innerHTML;
                }

                contentNode.cacheInputContent(this, _contentPropertyMap);

                this.classList.add('ha-flex-fixed');
            },

            get section() {
                return this._section;
            },

            set section(newSection) {
                this._fillSection(this, '_section', 'section .inner-content', newSection);
            },

            /**
             * Once the Drawer has being attached to the DOM we do the stuff that should be
             * done just once. Like events attachment.
             */
            createdCallback: function _() {
                _.super(this);
                this.on('button.drawer-hide:click', _toggle.bind(this));
            },

            /**
             * Adding CSS Classes to the parent in case the host app doesn't use flexbox and to fix the layout
             * for what the drawer needs it to be.
             */
            attachedCallback: function _() {
                _.super(this);
                _previousParentNode = this.parentElement;

                if (_previousParentNode && !_previousParentNode.classList.contains('ha-flex-columns') &&
                    !_previousParentNode.classList.contains('ha-flex-flexible')) {
                    _previousParentNode.classList.add('ha-flex-columns');
                    _previousParentNode.classList.add('ha-flex-flexible');
                }

                _setTargetSibling(this, this.targetSiblingSelector);
            },

            postRender: function _() {
                _.super(this);
                this.setAttribute('aria-labelledby', 'drawer-small-title-' + this.componentId);
                contentNode.storeCachedInput(this, _contentPropertyMap);
            },

            /**
             * Removing the classes we added on the attachement to the parent and the previous sibling so in
             * case that the consumer moves the drawer around the DOM, we can ensure that the layout will be consistent
             * and no extra flexbox clases will remain there innecesary.
             */
            detachedCallback: function() {
                if (_previousParentNode) {
                    _previousParentNode.classList.remove('ha-flex-columns');
                    _previousParentNode.classList.remove('ha-flex-flexible');
                }

                if (this.targetSiblingSelector) {
                    this.targetSiblingSelector = null;
                }
            },

            /**
             * Opens the Drawer, and makes the elements inside to be accesible from the keyboard.
             * @emits show
             */
            show: function() {
                if (!this._open) {
                    this._open = true;

                    _setContentHeight(this);

                    // making elements inside the Drawer visible for the keyboard
                    // the class slideIn, removes all the displays none in the header, content and footer
                    this.classList.add('slide-in');

                    this._lastFocus = this.ownerDocument.activeElement;
                    this.emit('show');
                }
            },

            /**
             * Closes the Drawer, and remove the elements inside from the keyboard access.
             * @emits close
             * @emits hide - for backward compatibility
             */
            close: function() {
                if (this._open) {
                    this._open = false;
                    this.classList.remove('slide-in');

                    // restore focus to last active element before drawer was opened
                    if (this._lastFocus) {
                        if (this._lastFocus.className.indexOf('btn-toggle') > -1) {
                            this._lastFocus.blur();
                        } else {
                            this._lastFocus.focus();
                        }
                    }

                    this._lastFocus = null;

                    this.emit('close');
                    this.emit('hide'); // for backward compatibility
                }
            },

            /**
             * Adds ha-flex-columns ha-flex-flexible to an element or an array of elements.
             * @param {Array} param
             */
            addFlexColumnClass: function(param) {
                var temp = [];
                if (param && Array.isArray(param)) {
                    temp = param;
                    temp.forEach(function(element) {
                        element.classList.add('ha-flex-columns');
                        element.classList.add('ha-flex-flexible');
                    });
                }
            },

            /**
             * Adds ha-flex-children to an array of elements.
             * @param {Array} param
             */
            addFlexChildrenClass: function(param) {
                var temp = [];
                if (param && Array.isArray(param)) {
                    temp = param;
                    temp.forEach(function(element) {
                        element.classList.add('ha-flex-children');
                    });
                }
            },

            /**
             * Adds content to the component
             * @param {object} config Mapping between HTML and properties
             * @deprecated Properties should be used directly instead
             */
            addContent: function(config) {
                contentNode.addContent(this, config, _contentPropertyMap);
            }
        });

    return register('ha-drawer-small', HADrawerSmall);
});

define('hui/popover',[
    'register-component/v2/register',
    'object-utils/classes',
    'register-component/v2/UIComponent',
    './core/a11y',
    './core/keys',
    './core/utils',
    './core/popup'
],
function(register, classes, UIComponent, a11y, keys, utils, popup) {

    /**
     * Handler onanimationend.
     * @param {AnimationEvent} eventName
     * @param {HTMLElement} component The popover component
     * @fires HA-Popover#show
     * @fires HA-Popover#close
     * @fires HA-Popover#hide (deprecated)
     */
    function _onAnimationEnd(eventName, component) {
        var lastElementChild, focusedElement;

        switch (eventName) {
            case 'ha-fade-in':
                component.classList.remove('enter');

                // focus on first child tabbable element when needed
                if (!component._noAutoFocusFirstTabbableElementOnShow) {
                    lastElementChild = component.lastElementChild;
                    if (lastElementChild) {
                        focusedElement = a11y.setFocusOnAnyFirst(lastElementChild);
                        if (!focusedElement) {
                            lastElementChild.focus();
                        }
                    }
                }

                component.open = true;
                component.emit('show');
                break;
            case 'ha-fade-out':
                component.classList.remove('visible');
                component.classList.remove('leave');

                // the default behavior is to focus on the last activeElement before we open the popover
                // to bypass that, use this._noAutoFocusLastActiveElementOnClose=true, usually set when a popover is used as composite component
                if (!component._noAutoFocusLastActiveElementOnClose && component.lastFocus) {
                    component.lastFocus.focus();
                }

                component.open = false;
                component.emit('hide');//deprecated. Will be removed in future versions.
                component.emit('close');
                break;
        }
    }

    /**
     * Handler blur.
     * @param {Event} evt Blur event.
     */
    function _onBlur(evt) {
        // Stores the ha-popover that has triggered the blur event
        var component = utils.getComponentFromElement(evt.target, 'HA-POPOVER');

        /* istanbul ignore next */
        if (component._closeOnBlur) {
            if (!evt.currentTarget.contains(evt.target)) {
                utils.stopEvent(evt);
            }

            if (!component.contains(utils.getSafeTargetFromEvent(evt)) || document.activeElement === evt.target) {
                component.close();
            }
        }
    }

    /**
     * Adds/removes connector element inside component, only if targetSelector matches a button element
     * @param  {HTMLElement} component Where to add the element
     * @param  {String} targetSelector The selector to position this component
     */
    function updateConnector(component, targetSelector) {
        var connector = component.querySelector('.connector'),
            target;

        if (targetSelector === '_previousSibling') {
            target = component.previousElementSibling;
        } else if (targetSelector !== '') {
            target = component.ownerDocument.querySelector(targetSelector);
        }

        if (!target) {
            return;
        }

        if (target.tagName === 'BUTTON' && !target.classList.contains('no-connector')) {
            if (!connector) {
                connector = component.ownerDocument.createElement('div');
                connector.classList.add('connector');
                component.insertBefore(connector, component.firstChild);
            }
        } else if (connector) {
            component.removeChild(connector);
        }
    }

    var HAPopover = classes.createObject(UIComponent, {

        init: function _() {
            _.super(this);

            var anim = utils.getAnimationEventNames();

            this.setupProperties({
                /**
                 * The selector for the "target" or "trigger" element - the element that invokes the popover
                 * @type {String}
                 */
                targetSelector: {
                    default: '_previousSibling',
                    change: function(newValue) {
                        updateConnector(this, newValue);
                    }
                }
            });

            this.on('keydown', function(evt) {
                if (keys.ESCAPE === evt.keyCode) {
                    var component = utils.getComponentFromElement(evt.target, 'HA-POPOVER');
                    if (component) {
                        component.close();
                    }
                }
            });

            this.on(anim.animationend, function(evt) {
                // the animation event could be triggered by a child element. We only listen for the event
                // directly triggered on the current popover
                if (evt.target === this) {
                    _onAnimationEnd(evt.animationName, evt.target);
                }
            }.bind(this));
        },

        set section(content) {
            var connector = this.querySelector('.connector');

            while (this.firstChildElement) {
                this.removeChild(this.firstChildElement);
            }

            if (connector) {
                this.appendChild(connector);
            }

            this.appendChild(content);

            this._section = content;
        },

        get section() {
            return this._section;
        },

        /**
         * Updates connector property if we are using cloneNode
         */
        postRender: function _() {
            _.super(this);

            /**
             * Flag to determine if component's first child tabbable element should get focus on show
             * Used usually when a popover is used as part of another component
             * @default false
             * @private
             * @type {Boolean}
             */
            this._noAutoFocusFirstTabbableElementOnShow = false;

            /**
             * Flag to determine if component should focus back on the last active element when closed
             * Used usually when a popover is used as part of another component
             * @default false
             * @private
             * @type {Boolean}
             */
            this._noAutoFocusLastActiveElementOnClose = false;

            /**
             * Flag to determine if the popover should close when blurred out
             * @default true
             * @private
             * @type {Boolean}
             */
            this._closeOnBlur = true;

            this.open = false;

            var content = this.querySelector('.connector') ? this.children[1] : this.children[0];

            if (content) {
                this._section = content;
            }

            this.tabIndex = -1;
        },

        /**
         * Add listener for losing focus
         */
        attachedCallback: function() {
            updateConnector(this, this.targetSelector);
            this.listenTo(this, 'blur', _onBlur, true);
        },

        /**
         * Adds html content to the component
         * @param {HTMLElement} content Content to append to the popover
         * @deprecated
         */
        addContent: function(content) {
            this.section = content;
            console.warn('DEPRECATION WARNING: addContent method should not be used anymore. Use section property instead.');
        },

        /**
         * Saves properties on conf object as private properties. Saves last focus
         * Adds 'enter' and 'visible' classes to trigger show animation
         */
        show: function() {
            var target = (this.targetSelector === '_previousSibling' ? this.previousElementSibling : this.ownerDocument.querySelector(this.targetSelector)),
                hasPositionSet = this.className.indexOf('position-') > -1,
                resizeMethod,
                self = this;

            if (!target || this.classList.contains('visible')) {
                return;
            }

            if (hasPositionSet || popup.setPosition(this, target)) {
                resizeMethod = popup.installResizeMethod(this, target);

                this.on('close', function onClose(evt) {
                    self.off('close', onClose);
                    // close event could be triggered by a child element. We only listen for a close event
                    // directly triggered on the current popover
                    if (evt.target === this) {
                        popup.uninstallResizeMethod(resizeMethod);
                        popup.clearPosition(this);
                    }
                });

                this.lastFocus = this.ownerDocument.activeElement;
                this.classList.remove('leave');
                this.classList.add('enter');
                this.classList.add('visible');
                this.tabIndex = 0;
            }
        },

        /**
         * Adds 'leave' class to trigger close animation
         */
        close: function() {
            this.classList.add('leave');
        },

        /**
         * Adds 'leave' class to trigger hide animation
         * @deprecated
         */
        hide: function() {
            this.close();
            console.warn('DEPRECATION WARNING: hide method should not be used anymore. Use close instead.');
        },

        /**
         * This method must be removed, once the hide method is also removed.
         */
        addEventListener: function _() {
            HTMLElement.prototype.addEventListener.apply(this, arguments);
            if (arguments[0] === 'hide') {
                console.warn('DEPRECATION WARNING: The hide event is going to be deprecated. From now on, please use "close" instead.');
            }
        }

    });

    return register('ha-popover', HAPopover);
});


define('text!hui/popover-form/popover-form.html',[],function () { return '<template>\n    <section></section>\n    <footer></footer>\n</template>';});


define('hui/popover-form',[
    'register-component/v2/register',
    'object-utils/classes',
    'register-component/v2/UIComponent',
    './core/contentNode',
    './core/a11y',
    'register-component/template!./popover-form/popover-form.html'
],
function(register, classes, UIComponent, contentNode, a11y, template) {
    'use strict';
    var contentPropertyMap = {
            'section': 'section',
            'footer': 'footer'
        },
        HAPopoverForm;

    HAPopoverForm = classes.createObject(UIComponent, {

        init: function _() {
            _.super(this);

            this.setupProperties({
                /**
                 * Sets the selector that will hold the name of a new item
                 * (relevant to Form Popover from Select Drop Down to add a new item)
                 * @type {String}
                 */
                addNewNameSelector: {
                    default: '',
                    type: String
                }
            });

            this._section = null;

            this._footer = null;

            /**
             * Template of the element.
             * @type {String}
             */
            this.template = template;

            this.tabIndex = -1;

            contentNode.cacheInputContent(this, contentPropertyMap);

            this.on('keydown', function(evt) {
                a11y.keepFocusInsideListener(evt, this);
            });
        },

        get section() {
            return this._section;
        },

        set section(newSection) {
            var section = this.querySelector('section');

            if (this._section) {
                this._section.forEach(function(item) {
                    section.removeChild(item);
                });
            }

            if (!newSection) {
                this._section = null;
                return;
            }
            if (Array.isArray(newSection)) {
                this._section = newSection;
                newSection.forEach(function(elem) {
                    section.appendChild(elem);
                });
            } else {
                this._section = [newSection];
                section.appendChild(newSection);
            }
        },

        get footer() {
            return this._footer;
        },

        set footer(newFooter) {
            var footer = this.querySelector('footer');

            if (this._footer) {
                this._footer.forEach(function(item) {
                    footer.removeChild(item);
                });
            }

            if (!newFooter) {
                this._footer = null;
                return;
            }
            if (Array.isArray(newFooter)) {
                this._footer = newFooter;
                newFooter.forEach(function(elem) {
                    footer.appendChild(elem);
                });
            } else {
                this._footer = [newFooter];
                footer.appendChild(newFooter);
            }
        },

        postRender: function _() {
            _.super(this);

            contentNode.storeCachedInput(this, contentPropertyMap);
        },

        /**
         * Adds content to the component
         * @param       {object} config Mapping between HTML and properties
         * @deprecated                  Properties should be used directly instead
         */
        addContent: function(config) {
            contentNode.addContent(this, config, contentPropertyMap);
            console.warn('DEPRECATION WARNING: addContent method should not be used anymore. Use section or footer property instead.');
        }

    });

    return register('ha-popover-form', HAPopoverForm);

});

define('hui/textarea',[
    'register-component/v2/register',
    './validatable/validatable',
    './core/utils',
    'object-utils/classes',
    './core/keys'
], function(register, Validatable, utils, classes, keys) {

    function passthrough(component, propertyName) {
        return function(value) {
            component.querySelector('textarea')[propertyName] = value;
        };
    }
    var validAtFocus = false,
    HATextarea = classes.createObject(Validatable, /** @lends HATextarea# */ {

        /** @constructs */
        init: function _() {

            _.super(this);

            // Flag to check if validation-related event listeners were already added to component
            this._validationListenersAdded = false;

            this.setupProperties(/** @lends HATextarea# */ {
                /**
                 * The visible width of the component, in average character widths
                 * @type {number}
                 * @default 20
                 */
                cols: {
                    type: Number,
                    default: 20,
                    change: passthrough(this, 'cols')
                },
                /**
                 * If true, the component is disabled in the UI
                 * @type {boolean}
                 */
                disabled: {
                    type: Boolean,
                    change: function(newValue) {
                        this.querySelector('textarea').disabled = newValue;

                        if (newValue) {
                            this.classList.add('disabled');
                        } else {
                            this.classList.remove('disabled');
                        }
                    }
                },
                /**
                 * Label to display for the component
                 * @type {string}
                 */
                label: {
                    default: '',
                    change: function(newValue) {
                        var textarea = this.querySelector('textarea'),
                            label = this.querySelector('label');

                        if (newValue) {
                            if (!label) {
                                label = this.ownerDocument.createElement('label');
                                this.insertBefore(label, textarea);
                            }
                            label.htmlFor = textarea.id;
                            label.textContent = utils.toggleSuffixText(newValue, ' *', this.required);

                            if (textarea.hasAttribute('aria-label')) {
                                textarea.removeAttribute('aria-label');
                            }
                        } else {
                            // if we have a label node, and label property is empty then remove it
                            if (label) {
                                this.removeChild(label);
                            }

                            if (textarea.placeholder) {
                                textarea.setAttribute('aria-label', textarea.placeholder);
                            }
                        }
                    }
                },
                /**
                 * Extra text to display in label if the value is optional
                 * @type {string}
                 * @default optional
                 */
                labelOptional: {
                    default: 'optional',
                    change: function(newValue) {
                        var spanOptional,
                            label = this.querySelector('label');

                        if (label) {
                            spanOptional = label.querySelector('span');

                            if (this.optional && spanOptional) {
                                spanOptional.innerHTML = ' ' + newValue;
                            }
                        }
                    }
                },
                /**
                 * The maximum number of characters that the user can enter
                 * @type {number}
                 * @default 524288
                 */
                maxLength: {
                    default: 524288,
                    type: Number,
                    change: passthrough(this, 'maxLength')
                },
                /**
                 * The minimum number of characters that the user can enter
                 * @type {number}
                 * @default 0
                 */
                minLength: {
                    default: 0,
                    type: Number,
                    change: passthrough(this, 'minLength')
                },
                /**
                 * Name for the component
                 * @type {string}
                 */
                name: {
                    default: '',
                    type: String,
                    change: passthrough(this, 'name')
                },
                /**
                 * Indicates whether the value is optional
                 * @type {boolean}
                 * @default false
                 */
                optional: {
                    default: false,
                    type: Boolean,
                    change: function(newValue) {
                        var spanOptional,
                            label = this.querySelector('label');

                        if (label) {
                            spanOptional = label.querySelector('span');

                            if (newValue) {
                                if (!spanOptional) {
                                    spanOptional = this.ownerDocument.createElement('span');
                                    label.appendChild(spanOptional);
                                }

                                spanOptional.innerHTML = ' ' + this.labelOptional;
                            } else {
                                if (spanOptional) {
                                    label.removeChild(spanOptional);
                                }
                            }
                        }
                    }
                },
                /**
                 * Regular expression pattern for validation
                 * @type {string}
                 */
                pattern: {
                    default: '',
                    change: function(newValue) {
                        if (newValue) {
                            _addValidationListeners(this, this.querySelector('textarea'));
                        } else {
                            _removeValidationListeners(this, this.querySelector('textarea'));
                        }
                    }
                },
                /**
                 * Placeholder text to display when no value is specified
                 * @type {string}
                 */
                placeholder: {
                    default: '',
                    type: String,
                    change: function(newValue) {
                        var textarea = this.querySelector('textarea');

                        textarea.placeholder = newValue;

                        if (!this.label) {
                            textarea.setAttribute('aria-label', newValue);
                        }
                    }
                },
                /**
                 * If true the value cannot be edited in the UI
                 * @type {boolean}
                 */
                readOnly: {
                    type: Boolean,
                    change: passthrough(this, 'readOnly')
                },
                /**
                 * Indicates whether the value is required
                 * @type {boolean}
                 * @default false
                 */
                required: {
                    default: false,
                    type: Boolean,
                    change: function(newValue, oldValue) {
                        var textarea = this.querySelector('textarea'),
                            label = this.querySelector('label');

                        if (newValue !== oldValue) {
                            if (label) {
                                label.textContent = utils.toggleSuffixText(label.textContent, ' *', newValue);
                            }

                            if (newValue) {
                                _addValidationListeners(this, textarea);
                            } else {
                                _removeValidationListeners(this, textarea);
                            }
                            textarea.required = newValue;
                            textarea.setAttribute('aria-required', newValue);
                        }
                    }
                },
                /**
                 * The number of visible text lines for the component
                 * @type {number}
                 * @default 2
                 */
                rows: {
                    type: Number,
                    default: 2,
                    change: passthrough(this, 'rows')
                },
                /**
                 * @property value Value for the component
                 * @type {string}
                 */
                value: {
                    type: String,
                    default: '',
                    change: passthrough(this, 'value')
                }
            });

            // @FIXME We need to reset this object for every instance.
            // It seems that the extend function makes the parent properties
            // work as static properties. Some research is needed here.
            this._validationData = {};
        },

        postRender: function _() {
            _.super(this);

            var textarea = this.querySelector('textarea'),
                valueAttribute = this.getAttribute('value');

            if (!textarea) {
                textarea = this.ownerDocument.createElement('textarea');
                this.appendChild(textarea);
            }

            textarea.id = 'ha-textarea-' + this.componentId;
            this.validationTarget = textarea;

            if (valueAttribute) {
                this.value = valueAttribute;
            }

            this.listenTo(textarea, 'change', function(event) {
                event.stopPropagation();
                this.emit('change');
            }.bind(this));

            this.listenTo(textarea, 'input', function(event) {
                event.stopPropagation();
                this.value = event.target.value;
                this.emit('input');
            }.bind(this));

            this.listenTo(textarea, 'focus', function() {
                validAtFocus = this.checkValidity();
            }.bind(this));

            this.listenTo(textarea, 'invalid', function(evt) {
                // stop default messages
                evt.preventDefault();
            });
        }
    });

    /**
     * Add the event listeners needed for the component
     * @param {HTMLElement} component context defined
     * @param {HTMLElement} textarea textarea element of the component defined
     * @private
     */
    function _addValidationListeners(component, textarea) {
        if (!component._validationListenersAdded) {
            component.listenTo(textarea, 'mouseenter', _reportValidity);
            component.listenTo(textarea, 'mouseout', _reportValidity);
            component.listenTo(textarea, 'focus', _reportValidity);
            component.listenTo(textarea, 'blur', _reportValidity);
            component.listenTo(textarea, 'keyup', _reportValidityOnKeyup);
            component.classList.add('ha-validatable');
            component._validationListenersAdded = true;
        }
    }

    /**
     * Remove all the event listeners for the component.
     * @param {HTMLElement} component context defined
     * @param {HTMLElement} textarea of the component defined
     * @private
     */
    function _removeValidationListeners(component, textarea) {
        if (!utils.validationRequired(component) && component._validationListenersAdded) {
            component.stopListening(textarea, 'mouseenter', _reportValidity);
            component.stopListening(textarea, 'mouseout', _reportValidity);
            component.stopListening(textarea, 'focus', _reportValidity);
            component.stopListening(textarea, 'blur', _reportValidity);
            component.stopListening(textarea, 'keyup', _reportValidityOnKeyup);
            component.classList.remove('ha-validatable');
            component._validationListenersAdded = false;
        }
    }

    /**
     * Search in the target defined the component that will check the validity.
     * @param {Event} evt
     * @private
     */
    function _reportValidity(evt) {
        var textarea = utils.getComponentFromElement(evt.target, 'HA-TEXTAREA');
        if (textarea) {
            textarea.reportValidity(evt);
        }
    }

    /**
     * Fires a validation on keyup, only if the input was in a failed state when focused
     * @param  {Event} evt  The keyup event
     * @private
     */
    function _reportValidityOnKeyup(evt) {
        if (!validAtFocus && evt.keyCode !== keys.TAB) {
            _reportValidity(evt);
        }
    }

    return register('ha-textarea', HATextarea);
});

define('hui/text-field',[
    'register-component/v2/register',
    './validatable/validatable',
    './core/utils',
    'object-utils/classes',
    './core/keys'
], function(register, Validatable, utils, classes, keys) {

    /**
     * Returns if the component has an active validation
     * @param  {HTMLElement} component The textfield
     * @return {Boolean}     true if there's at least an active validation
     */
    function validationActive(component) {
        return component.required || !!component.max || !!component.min || !!component.pattern;
    }

    var HATextField = classes.createObject(Validatable, {

        init: function _() {

            _.super(this);

            /**
             * Flag to check if listeners were already added to componente
             * @type {Boolean}
             */
            this._validationListenersAdded = false;

            /**
             * The element that the validator will use to get the values to validate
             * @type {HTMLElement}
             */
            this.validationTarget = this;

            /**
             * The selector for the elements to highlight if an error is detected
             * @type {String}
             */
            this.highlightElementSelector = 'input';

            this.setupProperties({
                /**
                 * label for the text-field control
                 * @type {String}
                 */
                label: {
                    default: '',
                    change: function(newValue) {
                        var input = this.querySelector('input'),
                            label = this.querySelector('label');

                        if (newValue) {
                            if (!label) {
                                label = this.ownerDocument.createElement('label');
                                this.insertBefore(label, input);
                            }
                            label.htmlFor = input.id;
                            label.textContent = utils.toggleSuffixText(newValue, ' *', this.required);

                            if (input.hasAttribute('aria-label')) {
                                input.removeAttribute('aria-label');
                            }
                        } else {
                            // if we have a label node, and label property is empty then remove it
                            if (label) {
                                this.removeChild(label);
                            }

                            if (input.placeholder) {
                                input.setAttribute('aria-label', input.placeholder);
                            }
                        }
                    }
                },

                optional: {
                    default: false,
                    type: Boolean,
                    change: function(newValue) {
                        var spanOptional,
                            label = this.querySelector('label');

                        if (label) {
                            spanOptional = label.querySelector('span');

                            if (newValue) {
                                if (!spanOptional) {
                                    spanOptional = this.ownerDocument.createElement('span');
                                    label.appendChild(spanOptional);
                                    spanOptional.innerHTML = ' ' + this.labelOptional;
                                }
                            } else {
                                if (spanOptional) {
                                    label.removeChild(spanOptional);
                                }
                            }
                        }
                    }
                },

                /**
                 * declares the text that will be used to describe optional fields
                 * @type {String}
                 */
                labelOptional: {
                    default: 'optional',
                    change: function(newValue) {
                        var spanOptional,
                            label = this.querySelector('label');

                        if (label) {
                            spanOptional = label.querySelector('span');

                            if (this.optional && spanOptional) {
                                spanOptional.innerHTML = ' ' + newValue;
                            }
                        }
                    }
                },

                /**
                 * this sets the value for the text input
                 * @property value See set value() and get value() for the logic
                 * @type {String}
                 */

                /**
                 * this sets the name for the text input
                 * @type {String}
                 */
                name: {
                    default: '',
                    change: function(newValue) {
                        this.querySelector('input').name = newValue;
                    }
                },

                /**
                 * this sets the autoComplete for the text input
                 * @type {String}
                 */
                autoComplete: {
                    default: 'on',
                    change: function(newValue) {
                        this.querySelector('input').autocomplete = newValue;
                    }
                },

                /**
                 * this sets the size for the text input
                 * @type {Number}
                 */
                size: {
                    default: 20,
                    type: Number,
                    change: function(newValue) {
                        this.querySelector('input').size = newValue;
                    }
                },

                /**
                 * placeholder for the text-field control
                 * @type {String}
                 */
                placeholder: {
                    default: '',
                    change: function(newValue) {
                        var input = this.querySelector('input');

                        input.placeholder = newValue;

                        if (!this.label) {
                            input.setAttribute('aria-label', newValue);
                        }

                        // cleanup attributes
                        if (!newValue) {
                            if (input.hasAttribute('aria-label')) {
                                input.removeAttribute('aria-label');
                            }
                            if (input.hasAttribute('placeholder')) {
                                input.removeAttribute('placeholder');
                            }
                            if (this.hasAttribute('placeholder')) {
                                this.removeAttribute('placeholder');
                            }
                        }
                    }
                },

                /**
                 * disabled indicates whether the field is disabled
                 * @type {Boolean}
                 */
                disabled: {
                    default: false,
                    type: Boolean,
                    change: function(newValue) {
                        this.querySelector('input').disabled = newValue;

                        if (newValue) {
                            this.classList.add('disabled');
                        } else {
                            this.classList.remove('disabled');
                        }
                    }
                },

                /**
                 * required indicates whether the field is optional
                 * @type {Boolean}
                 */
                required: {
                    default: false,
                    type: Boolean,
                    change: function(newValue, oldValue) {
                        var input = this.querySelector('input'),
                            label = this.querySelector('label');

                        if (newValue !== oldValue) {
                            if (label) {
                                label.textContent = utils.toggleSuffixText(label.textContent, ' *', newValue);
                            }

                            if (newValue) {
                                _addValidationListeners(this, input);
                            } else {
                                _removeValidationListeners(this, input);
                            }
                            this.handleTooltipBinding(validationActive(this));

                            input.required = newValue;
                            input.setAttribute('aria-required', newValue);
                        }
                    }
                },

                /**
                 * Specifies the maximum number of characters that the user can enter.
                 * @type {Number}
                 */
                maxLength: {
                    default: 524288,
                    type: Number,
                    change: function(newValue) {
                        this.querySelector('input').maxLength = newValue;
                    }
                },

                /**
                 * Specifies the pattern the value should match
                 * @type {String}
                 */
                pattern: {
                    default: '',
                    change: function(newValue) {
                        var input = this.querySelector('input');

                        if (newValue) {
                            input.pattern = newValue;
                            _addValidationListeners(this, input);
                        } else {
                            input.removeAttribute('pattern');
                            _removeValidationListeners(this, input);
                        }
                    }
                },

                min: {
                    change: function(newValue, oldValue) {
                        if (newValue !== oldValue) {
                            this.handleTooltipBinding(validationActive(this));
                        }
                    }
                },

                max: {
                    change: function(newValue, oldValue) {
                        if (newValue !== oldValue) {
                            this.handleTooltipBinding(validationActive(this));
                        }
                    }
                }
            });

            // @FIXME We need to reset this object for every instance.
            // It seems that the extend function makes the parent properties
            // work as static properties. Some research is needed here.
            this._validationData = {};

        },

        postRender: function _() {
            _.super(this);

            var input = this.querySelector('input'),
                attributeValue;

            if (!input) {
                input = this.ownerDocument.createElement('input');
                this.appendChild(input);
                input.type = 'text';
            }

            input.id = 'ha-text-field-' + this.componentId;
            this.highlightElement = input;

            // if declarative instantiation has an attribute, sync to the this.value
            attributeValue = this.getAttribute('value');
            if (attributeValue) {
                // lets sync the attribute "value" to the component "value" property which then sets to the local input
                this.value = attributeValue;
            }

            // this assures while typing, the local input.value is copied to the host this.value
            this.listenTo(input, 'input', function(evt) {
                evt.stopPropagation();
                this.value = evt.target.value;
                // this makes sure the evt.target is the host component
                this.emit('input');
            }.bind(this));

            //This event listeners are created for preventing the change and click events to bubble up.
            this.listenTo(input, 'change', function(evt) {
                evt.stopPropagation();
                // this makes sure the evt.target is the host component
                this.emit('change');
            }.bind(this));

            this.listenTo(input, 'focus', function() {
                this._validAtFocus = this.checkValidity();
            }.bind(this));

            this.listenTo(input, 'invalid', function(evt) {
                // stop default messages
                evt.preventDefault();
            });
        },

        // We added get/set value and attributeChangedCallback for value instead of using setupProperties because
        // when user types in a value we use the input event to hydrate the this.value property
        // when we are typing at the middle of a text, the cursor is set back to the end because the change observer resets the local input value

        get value() {
            return this.querySelector('input').value;
        },

        set value(newValue) {
            // sync the newValue to the local input value if they are different
            if (newValue !== this.value) {
                this.querySelector('input').value = newValue;
            }

            // sync the newValue to the host attribute "value" if they are different
            if (newValue !== this.getAttribute('value')) {
                this.setAttribute('value', newValue);
            }
        },

        attributeChangedCallback: function _(attrName, oldValue, newValue) {
            // happens when we modify the attribute via browser inspector or via setAttribute
            if (attrName === 'value') {
                // call the value setter which handles the logic
                this.value = newValue;
            } else {
                _.super(this, attrName, oldValue, newValue);
            }
        },

        /**
         * Calling on the focus method should in turn focus on the internal text field
         * @method focus
         * @public
         */
        focus: function() {
            this.querySelector('input').focus();
        },

        _getInputElement: function() {
            return this.querySelector('input');
        }
    });

    /**
     * Add the events listener needed for the component
     * @param {HTMLElement} component context defined
     * @private
     */
    function _addValidationListeners(component, input) {
        if (!component._validationListenersAdded) {
            component.listenTo(component, 'mouseenter', _reportValidity);
            component.listenTo(component, 'mouseout', _reportValidity);
            component.listenTo(component, 'focus', _reportValidity, true);
            component.listenTo(input, 'blur', _reportValidity);
            component.listenTo(component, 'keyup', _reportValidityOnKeyup);
            component.classList.add('ha-validatable');
            component._validationListenersAdded = true;
        }
    }

    /**
     * Remove all the events listener for the component.
     * @param {HTMLElement} component context defined
     * @private
     */
    function _removeValidationListeners(component, input) {
        if (!utils.validationRequired(component) && component._validationListenersAdded) {
            component.stopListening(component, 'mouseenter', _reportValidity);
            component.stopListening(component, 'mouseout', _reportValidity);
            component.stopListening(component, 'focus', _reportValidity, true);
            component.stopListening(input, 'blur', _reportValidity);
            component.stopListening(component, 'keyup', _reportValidityOnKeyup);
            component.classList.remove('ha-validatable');
            component._validationListenersAdded = false;
        }
    }

    /**
     * Search in the target defined the component that will check the validity.
     * @param {Event} evt
     * @private
     */
    function _reportValidity(evt) {
        var component = utils.getComponentFromElement(evt.target, 'HA-TEXT-FIELD');
        if (component) {
            component.reportValidity(evt);
        }
    }

    /**
     * Fires a validation on keyup, only if the input was in a failed state when focused
     * @param  {Event} evt  The keyup event
     * @private
     */
    function _reportValidityOnKeyup(evt) {
        var component = utils.getComponentFromElement(evt.target, 'HA-TEXT-FIELD');
        if (!component._validAtFocus && evt.keyCode !== keys.TAB) {
            _reportValidity(evt);
        }
    }

    return register('ha-text-field', HATextField);
});


define('text!hui/toast-message/toast-message.html',[],function () { return '<template>\n\t<div class="toast-wrapper">\n\t\t<button aria-label="Close" class="hi hi-close"></button>\n\t\t<i class="hi hi-confirm hi-circle-check"></i>\n\t\t<p>{{{message}}}</p>\n\t</div>\n</template>';});


define('hui/toast-message',[
    'object-utils/classes',
    'register-component/v2/register',
    'register-component/v2/UIComponent',
    'register-component/template!./toast-message/toast-message.html',
    './core/keys',
    './core/utils'
], function(classes, register, UIComponent, template, keys, utils) {
    'use strict';

    /**
     * Cleans the timmer for the given id.
     * @param {Number} timmerId The timmer id to be cleaned.
     */
    function _cleanTimmer(timmerId) {
        window.clearTimeout(timmerId);
        timmerId = null;
    }

    /**
     * Animates the leaving of the ToasMessage as the entrance, but backwards.
     * @param {HTML} component The component to be inspected.
     */
    function _animateBackwards(component) {
        _cleanTimmer(_closeTimeout);

        component.classList.remove('animate');

        _closeTimeout = window.setTimeout(function() {
            component.classList.remove('visible');
            if (component._clearTimeout) {
                component._clearTimeout();
            }
        }.bind(component), _ANIMATION_DURATION);
    }

    /**
     * keeps track of the last visible toast, to close it when a new one is shown
     * @type {HTMLElement}
     */
    var _lastShownToast,

    /**
     * keeps track of the hidden timeout id to be clean before using it again.
     */
    _closeTimeout,

    /**
     * The animation entrance duration.
     * Used to wait the animation out before hidding the element.
     * @type {Number}
     */
    _ANIMATION_DURATION = 200,

    HAToastMessage = classes.createObject(UIComponent, {

        init: function _() {

            _.super(this);

            /**
             * Template of the element.
             * @type {String}
             */
            this.template = template;

            /**
             * Text to display, can be html.
             * @type {String / HTMLElement}
             */
            this._message = '';

            /**
             * Type of toaster that display, shows an icon before the
             * message (e.g. 'confirm', 'info', 'error', 'alert', 'warn') and
             * changes the border.
             * @type {String}
             * @default confirm
             */
            this._type = 'confirm';

            /**
             * shows close icon if true and user can dismiss immediately
             * @type {String}
             */
            this._dismissible = true;

            this.setupProperties({
                /**
                 * ms, -1 remains visible until dismissed explicitly
                 * @type {Number}
                 */
                duration: {
                    default: 8000,
                    type: Number
                }
            });

            this.tabIndex = '-1';

            /**
             * @emits dismiss
             */
            this.on('button:click', function() {
                this.emit('dismiss');
                this.close();
            }.bind(this));

            this.on('keydown', function(evt) {
                var key = evt.keyCode;
                if (key === keys.ESCAPE) {
                    this.close();
                }
            }.bind(this));
        },

        // This setter is left just for compatibilty with older versions
        set type(newValue) {
            // jshint unused:false
            console.warn('DEPRECATION WARNING: "type" property is going to be deprecated, please from now on don\'t use it.');
        },

        get type() {
            console.warn('DEPRECATION WARNING: "type" property is going to be deprecated, please from now on don\'t use it.');
            return this._type;
        },

        set message(newValue) {
            var container = this.querySelector('.toast-wrapper > p'),
                i = 0,
                value;

            while (container.firstChild) {
                container.removeChild(container.firstChild);
            }

            if (newValue) {
                if (typeof newValue === 'string') {
                    container.innerHTML = newValue;
                } else if (Array.isArray(newValue)) {
                    for (; i < newValue.length; i++) {
                        value = newValue[i];
                        if (value && value.nodeType) {
                            container.appendChild(value);
                        }
                    }
                } else if (newValue.nodeType) {
                    container.appendChild(newValue);
                }
            }
            this._message = newValue;
        },

        get message() {
            return this._message;
        },

        set dismissible(newValue) {
            var closeButton = this.querySelector('button');

            if (newValue) {
                closeButton.classList.remove('hidden');
                closeButton.classList.add('show');
            } else {
                closeButton.classList.remove('show');
                closeButton.classList.add('hidden');
            }

            this._dismissible = newValue;
        },

        get dismissible() {
            return this._dismissible;
        },

        /**
         * Show toast message
         * @emits show
         */
        show: function() {
            if (_lastShownToast &&
                _lastShownToast.classList.contains('visible') &&
                !_lastShownToast.isEqualNode(this)) {
                _lastShownToast.close();
            }
            _lastShownToast = this;
            var _timeoutId;

            this._clearTimeout();
            this.classList.add('animate');
            this.classList.add('visible');
            this.emit('show');

            if (this.duration > 0) {
                _timeoutId = setTimeout(this.close.bind(this), this.duration);
                this._clearTimeout = function() {
                    clearTimeout(_timeoutId);
                    this._clearTimeout = function() {};
                };
            }
            this._lastFocus = document.activeElement;
            this.focus();
        },

        /**
         * Close toast message
         * @emits close
         * @emits hide
         */
        close: function() {
            _lastShownToast = null;

            _animateBackwards(this);

            this.emit('close');
            this.emit('hide');

            if (this._lastFocus) {
                this._lastFocus.focus();
            }
        },

        /**
         * Calls the close method.
         * @deprecated
         */
        hide: function() {
            console.warn('DEPRECATION WARNING: This method is going to be deprecated, please from now on use "close" instead.');
            this.close();
        },

        preRender: function _() {
            var messages = this.querySelector('.toast-wrapper > p');
            this._message = messages ? utils.removeNodesSafe(messages, messages.childNodes) : utils.removeNodesSafe(this, this.childNodes);
            this._clearTimeout = function() {
            };
        },

        postRender: function _() {
            this.setAttribute('role', 'status');

            this.message = this._message;

            if (this.getAttribute('dismissible') === 'false') {
                this.dismissible = false;
            } else {
                this.dismissible = true;
            }
        },

        detachedCallback: function _() {
            _lastShownToast = null;
            _cleanTimmer(_closeTimeout);
            _closeTimeout = null;

            this._clearTimeout = null;
            delete this._clearTimeout;
        },

        /**
         * This method must be removed, once the hide method is also removed.
         */
        addEventListener: function _() {
            HTMLElement.prototype.addEventListener.apply(this, arguments);
            if (arguments[0] === 'hide') {
                console.warn('DEPRECATION WARNING: The hide event is going to be deprecated. From now on, please use "close" instead.');
            }
        }
    });

    return register('ha-toast-message', HAToastMessage);
});

define('hui/trowser/trowser-base',[
        'object-utils/classes',
        'register-component/v2/UIComponent',
        '../core/a11y',
        '../core/contentNode'
    ],
    function(classes, UIComponent, a11y, contentNode) {
        'use strict';

        function _updateHeaderItem(component, isNew, type, icon, position) {
            var item,
                newItems,
                pageModalHeader = component.querySelector('ha-page-modal-header'),
                headerItems = pageModalHeader.headerItems;
            if (isNew) {
                item = component.ownerDocument.createElement('ha-page-modal-header-item');
                item.type = type;
                item.icon = icon;
                item.setAttribute('position', position);
                pageModalHeader.headerItems = headerItems.concat(item);
            } else {
                newItems = component.querySelectorAll('ha-page-modal-header-item:not([type="' + type + '"])');
                pageModalHeader.headerItems = Array.prototype.slice.call(newItems);
            }
        }

        var mapPositions = {
                primary: 'right',
                secondary: 'right',
                tertiary: 'center'
            },

            contentPropertyMap = {
                'section': 'section',
                'footer': 'footerItems'
            },

            TrowserBase = classes.createObject(UIComponent, {

                init: function _() {
                    _.super(this);

                    /**
                     * Array of node elements shown in the footer.
                     * NOTE: The node needs to have the action property.
                     * Possible values are "primary", "secondary", "tertiary"
                     * @type {Array}
                     */
                    this._footerItems = null;

                    /**
                     * Shows X button.
                     * NOTE: by default is true.
                     * @type {Boolean}
                     */
                    this._dismissible = true;

                    /**
                     * Shows help icon button.
                     * NOTE: by default is true.
                     * @type {Boolean}
                     */
                    this._help = true;

                    contentNode.cacheInputContent(this, contentPropertyMap);

                    this.setupProperties({

                        /**
                         * The Title of the Trowser.
                         * @type {String}
                         */
                        titleText: {
                            type: String,
                            default: '',
                            change: function(newValue) {
                                var pageModalHeader = this.querySelector('ha-page-modal-header');
                                pageModalHeader.titleText = newValue;
                            }
                        },

                        /**
                         * The secondary info message displayed on the right of the title.
                         * @type {String}
                         */
                        infoText: {
                            type: String,
                            default: '',
                            change: function(newValue) {
                                var pageModalHeader = this.querySelector('ha-page-modal-header');
                                pageModalHeader.infoText = newValue;
                            }
                        },

                        /**
                         * Shows history icon button.
                         * NOTE: by default is false.
                         * @type {Boolean}
                         */
                        history: {
                            type: Boolean,
                            default: false,
                            change: function(newValue) {
                                _updateHeaderItem(this, newValue, 'history', 'history', 'left');
                            }
                        },

                        /**
                         * Shows settings icon button.
                         * NOTE: by default is false.
                         * @type {Boolean}
                         */
                        settings: {
                            type: Boolean,
                            default: false,
                            change: function(newValue) {
                                _updateHeaderItem(this, newValue, 'settings', 'settings-o', 'right');
                            }
                        }
                    });
                },

                //dismissible and help properties are simple booleans. We should be declaring them in the setupProperties
                //method, in order to achieve dynamic binding. But currently, because of a known issue en setupProperties,
                //a boolean property will always have a default false value, no matter what we set.
                //When the issue is resolved, and we're able to set a true default value, change this logic to allow
                //dynamic binding
                set dismissible(newValue) {
                    var pageModalHeader = this.querySelector('ha-page-modal-header');
                    pageModalHeader.dismissible = newValue;
                },

                get dismissible() {
                    return this._dismissible;
                },

                set help(newValue) {
                    _updateHeaderItem(this, newValue, 'help', 'help-o', 'right');
                },

                get help() {
                    return this._help;
                },

                set footerItems(newItems) {
                    var pageModalFooter = this.querySelector('ha-page-modal-footer'),
                        pageModalFooterChildren,
                        buttonItems = [],
                        items;

                    if (newItems) {
                        // Currently, contentNode is caching nodes using childNodes. That could end
                        // grabbing some unwanted text nodes, and here we're only interested in elements
                        newItems = Array.prototype.filter.call(newItems, function(element) {
                            return element.nodeType === 1;
                        });

                        // This will occur when we clone the component.
                        // Because the footer will contain the "ha-page-modal-footer".
                        // So, we need to get the elements inside the structure and fill "newItems" with that.
                        if (newItems.length > 0 && newItems[0].localName === pageModalFooter.localName) {
                            pageModalFooterChildren = Array.prototype.slice.call(newItems[0].children);
                            newItems.length = 0;
                            pageModalFooterChildren.forEach(function(child) {
                                if (child.children.length > 0) {
                                    items = Array.prototype.slice.call(child.children);
                                    items.forEach(function(item) {
                                        newItems.push(item);
                                    });
                                }
                            });
                        }

                        Array.prototype.forEach.call(newItems, function(element) {
                            var action = element.getAttribute('action');
                            if (action) {
                                element.setAttribute('position', mapPositions[action]);
                                if (element.getAttribute('action') === 'primary') {
                                    buttonItems.push(element);
                                } else {
                                    buttonItems.unshift(element);
                                }
                            }
                        });
                    }

                    pageModalFooter.footerItems = buttonItems;
                    this._footerItems = newItems;
                },

                get footerItems() {
                    return this._footerItems;
                },

                set section(newSection) {
                    var pageModal = this.querySelector('ha-page-modal');
                    pageModal.section = newSection;
                    this._section = newSection;
                },

                get section() {
                    return this._section;
                },

                preRender: function _() {
                    var pageModal = this.ownerDocument.createElement('ha-page-modal');

                    _.super(this);
                    this.innerHTML = '';
                    this.appendChild(pageModal);
                },

                postRender: function _() {
                    var pageModal,
                        pageModalFooter,
                        pageModalHeader;

                    _.super(this);
                    pageModal = this.querySelector('ha-page-modal');
                    pageModalFooter = this.ownerDocument.createElement('ha-page-modal-footer');
                    pageModal.footer = pageModalFooter;
                    pageModalHeader = this.ownerDocument.createElement('ha-page-modal-header');
                    pageModal.header = pageModalHeader;

                    contentNode.storeCachedInput(this, contentPropertyMap);

                    if (this.getAttribute('help') !== 'false') {
                        this.help = true;
                    }

                    if (this.getAttribute('dismissible') !== 'false') {
                        this.dismissible = true;
                    }

                },

                /**
                 * Open the element.
                 * @emit ha-page-modal:show
                 */
                show: function() {
                    a11y.setFocusOnFirst(this);
                    this.querySelector('ha-page-modal').show();
                },

                /**
                 * @deprecated Use the header, section and footerItems properties instead
                 * Sets the content of the page modal
                 */
                addContent: function(config) {
                    contentNode.addContent(this, config, contentPropertyMap);
                    console.warn('DEPRECATION WARNING: addContent method should not be used anymore to add ' +
                    'content to the component. This will be removed in the future so please assign content ' +
                    'directly to the corresponding component properties instead.');
                },

                /**
                 * @deprecated Use close method instead
                 * Closes the Trowser.
                 */
                hide: function() {
                    this.close();
                    console.warn('DEPRECATION WARNING: The hide method is deprecated, use "close" method instead');
                },

                /**
                 * Closes the Trowser.
                 * @emit ha-trowser:close
                 */
                close: function() {
                    this.querySelector('ha-page-modal').close();
                    this.emit('close');
                }

            });

        return TrowserBase;
    })
;

define('hui/trowser/page-modal-footer',[
    'object-utils/classes',
    'register-component/v2/UIComponent',
    'register-component/v2/register'
], function(classes, UIComponent, register) {
    'use strict';

    /**
     * Assign the position to each footer element
     * @param {Array} items
     * @param {String} position
     * @return {Array}
     */
    function _addPositionAttribute(items, position) {
        for (var i = 0; i < items.length; i++) {
            items[i].setAttribute('position', position);
        }

        return Array.prototype.slice.call(items);
    }

    /**
     * Appends or removes elements from their corresponding container
     * @param  {HTMLElement} component the page-modal-footer
     * @param  {Array} items  array of nodeElements
     * @param  {Function} action appendChild || removeChild
     */
    function _handleFooterItems(component, items, action) {
        var leftSpan = component.querySelector('.footer-left'),
            rightSpan = component.querySelector('.footer-right'),
            centerSpan = component.querySelector('.footer-center'),
            itemsNumber = items.length,
            i;

        for (i = 0; i < itemsNumber; i++) {
            switch (items[i].getAttribute('position') || items[i].position) {
                case 'left':
                    action.call(leftSpan, items[i]);
                    break;
                case 'right':
                    action.call(rightSpan, items[i]);
                    break;
                case 'center':
                    action.call(centerSpan, items[i]);
                    break;
            }
        }
    }

    var HAPageModalFooter = classes.createObject(UIComponent, {

        init: function _() {
            _.super(this);

            /**
             * Arrays of footer items.
             * @type {Array}
             */
            this._footerItems = [];
        },

        set footerItems(items) {
            _handleFooterItems(this, this._footerItems, Node.prototype.removeChild);
            _handleFooterItems(this, items, Node.prototype.appendChild);

            this._footerItems = items;
        },

        get footerItems() {
            return this._footerItems;
        },

        postRender: function _() {
            var leftSpan = this.querySelector('.footer-left'),
                rightSpan = this.querySelector('.footer-right'),
                centerSpan = this.querySelector('.footer-center'),
                items = [];

            _.super(this);
            this.tabIndex = -1;
            if (leftSpan) {
                //we already created the containers
                if (leftSpan && leftSpan.children.length > 0) {
                    items = items.concat(_addPositionAttribute(leftSpan.children, 'left'));
                }
                if (rightSpan && rightSpan.children.length > 0) {
                    items = items.concat(_addPositionAttribute(rightSpan.children, 'right'));
                }
                if (centerSpan && centerSpan.children.length > 0) {
                    items = items.concat(_addPositionAttribute(centerSpan.children, 'center'));
                }
                this.footerItems = items;
            } else {
                //create the containers
                leftSpan = this.ownerDocument.createElement('span');
                rightSpan = this.ownerDocument.createElement('span');
                centerSpan = this.ownerDocument.createElement('span');
                leftSpan.className = 'footer-left';
                rightSpan.className = 'footer-right';
                centerSpan.className = 'footer-center';
                this.appendChild(leftSpan);
                this.appendChild(centerSpan);
                this.appendChild(rightSpan);
            }
        }

    });

    return register('ha-page-modal-footer', HAPageModalFooter);
});

define('hui/trowser/page-modal-header-item',[
    'object-utils/classes',
    'register-component/v2/UIComponent',
    'register-component/v2/register'
], function(classes, UIComponent, register) {
    'use strict';

    var HAPageModalHeaderItem = classes.createObject(UIComponent, {

        init: function _() {
            _.super(this);

            this.setupProperties({

                /**
                 * Property to set the unique identifier for this Page Modal Header Item.
                 * @type {String}
                 */
                type: {
                    type: String,
                    default: '',
                    change: function(newValue) {
                        var button = this.querySelector('.header-button');
                        if (newValue) {
                            button.setAttribute('aria-label', newValue);
                        }
                    }
                },

                /**
                 * Property to set the location of the Page Modal Header Item ('left' / 'center' / 'right').
                 * @type {String}
                 */
                position: {
                    type: String,
                    default: ''
                },

                /**
                 * Property to set the icon class of the Page Modal Header Item.
                 * @type {String}
                 */
                icon: {
                    type: String,
                    default: '',
                    change: function(newValue, oldValue) {
                        var span = this.querySelector('span');

                        if (newValue) {
                            span.classList.remove('hi-' + oldValue);
                            span.classList.add('hi-' + newValue);
                        }
                    }
                }
            });
        },

        createdCallback: function _() {
            var itemButton;

            _.super(this);
            itemButton = this.querySelector('button');

            this.listenTo(itemButton, 'blur', function() {
                this.unselect();
            }.bind(this));
        },

        /**
         * Callback attached after the Component render
         */
        postRender: function _() {
            var buttonElement,
                spanElement;

            _.super(this);

            buttonElement = this.querySelector('.header-button') || this.ownerDocument.createElement('button');
            spanElement = this.querySelector('span') || this.ownerDocument.createElement('span');
            buttonElement.className = 'header-button';
            buttonElement.appendChild(spanElement);
            buttonElement.classList.add('btn');
            buttonElement.classList.add('btn-link');
            spanElement.classList.add('hi');
            this.appendChild(buttonElement);
        },

        /**
         * Emits the 'select' event and set the 'selected' class to the Page Modal Header Item.
         * @emit select
         */
        select: function() {
            this.emit('select', {target: this});
            this.classList.add('selected');
        },

        /**
         * Removes the 'selected' class from the Page Modal Header Item.
         * @emit unselect
         */
        unselect: function() {
            this.emit('unselect', {target: this});
            this.classList.remove('selected');
        }

    });

    return register('ha-page-modal-header-item', HAPageModalHeaderItem);
});

define('text!hui/trowser/page-modal-header.html',[],function () { return '<template>\n    <span class="header-left"></span>\n    <span class="header-center"></span>\n    <span class="header-right pull-right">\n        <ha-page-modal-header-item icon="close" position="right" type="close">\n        </ha-page-modal-header-item>\n    </span>\n</template>\n';});


define('hui/trowser/page-modal-header',[
    'object-utils/classes',
    'register-component/v2/UIComponent',
    'register-component/v2/register',
    'register-component/template!./page-modal-header.html'
], function(classes, UIComponent, register, template) {
    'use strict';

    /**
     * Appends or removes elements from their corresponding container
     * @param  {HTMLElement} component the page-modal-footer
     * @param  {Array} items  array of nodeElements
     * @param  {Function} action appendChild || removeChild
     */
    function _handleHeaderItems(component, items, action) {
        var headerLeft = component.querySelector('.header-left'),
            headerCenter = component.querySelector('.header-center'),
            headerRight = component.querySelector('.header-right'),
            // The "name" property of a function, isn't supported on IE.
            // So, we used a regular expression to get the name of the action.
            // This has cross-browser compatibility.
            actionName = (/function\s([^(]{1,})\(/).exec(action.toString())[1],
            closeItem;

        items.forEach(function(item) {
            switch (item.getAttribute('position') || item.position) {
                case 'left':
                    item.classList.add('pull-left');
                    action.call(headerLeft, item);
                    break;
                case 'right':
                    if (actionName === 'removeChild') {
                        action.call(headerRight, item);
                    } else if (actionName === 'appendChild') {
                        closeItem = component.querySelector('[type="close"]');

                        // If the header has a close button,
                        // we need to add the others elements at his left.
                        if (closeItem) {
                            headerRight.insertBefore(item, closeItem);
                        } else {
                            action.call(headerRight, item);
                        }
                    }
                    break;
                case 'center':
                    action.call(headerCenter, item);
                    break;
            }
        }.bind(component));
    }

    var cachedItems,
    cachedTitleText,
    cachedInfoText,
    HAPageModalHeader = classes.createObject(UIComponent, {

        init: function _() {
            _.super(this);

            this.template = template;

            /**
             * Property with the content of the Page Modal Header (ha-page-modal-header-item).
             * @type {Array}
             */
            this._headerItems = [];

            this.setupProperties({

                /**
                 * Property to set the title of the Page Modal Header.
                 * @type {String}
                 */
                titleText: {
                    type: String,
                    default: '',
                    change: function(newValue) {
                        var titleTextEl,
                            headerCenter;
                        if (newValue) {
                            titleTextEl = this.querySelector('.title-text');
                            headerCenter = this.querySelector('.header-center');
                            if (titleTextEl) {
                                titleTextEl.textContent = newValue;
                            } else {
                                titleTextEl = this.ownerDocument.createElement('label');
                                titleTextEl.textContent = this.titleText;
                                titleTextEl.className = 'title-text pull-left';

                                headerCenter.appendChild(titleTextEl);
                            }
                        }
                    }
                },

                /**
                 * Property to set the secondary info message of the Page Modal Header.
                 * @type {String}
                 */
                infoText: {
                    type: String,
                    default: '',
                    change: function(newValue) {
                        var infoTextEl,
                            headerRight;

                        if (newValue) {
                            infoTextEl = this.querySelector('.info-text');
                            headerRight = this.querySelector('.header-right');
                            if (infoTextEl) {
                                infoTextEl.textContent = this.infoText;
                            } else {
                                infoTextEl = this.ownerDocument.createElement('label');
                                infoTextEl.textContent = this.infoText;
                                infoTextEl.className = 'info-text ghost-text pull-left';
                                //infoText and headerItems change handlers add elements to the right part of the
                                //header. Different instantiations may cause elements to be inserted in different order
                                //Inserting the infoText element at the beggining, prevent these possible differences
                                headerRight.insertBefore(infoTextEl, headerRight.firstChild);
                            }
                        }
                    }
                },

                /**
                 * Property to set if the Page Modal Header shows the close button (true / false).
                 * @type {Boolean}
                 */
                dismissible: {
                    type: Boolean,
                    default: true,
                    change: function(newValue) {
                        var closeButtonContainer = this.querySelector('[type="close"]'),
                            closeButton = closeButtonContainer.querySelector('button');
                        if (newValue) {
                            closeButtonContainer.classList.remove('hidden');
                            closeButtonContainer.classList.add('show');
                            if (closeButton) {
                                closeButton.setAttribute('aria-label', 'close');
                            }
                        } else {
                            closeButtonContainer.classList.remove('show');
                            closeButtonContainer.classList.add('hidden');
                        }
                    }
                }

            });

        },

        set headerItems(items) {
            _handleHeaderItems(this, this._headerItems, Node.prototype.removeChild);
            _handleHeaderItems(this, items, Node.prototype.appendChild);

            this._headerItems = items;
        },

        get headerItems() {
            return this._headerItems;
        },

        createdCallback: function _() {
            _.super(this);
            this.on('ha-page-modal-header-item button:click', function(event) {
                var itemSelected = event.target;

                while (itemSelected.localName !== 'ha-page-modal-header-item') {
                    itemSelected = itemSelected.parentNode;
                }

                if (itemSelected.getAttribute('type') === 'close') {
                    this.emit('dismiss');
                } else {
                    this.select(itemSelected);
                }
            }.bind(this));
        },

        preRender: function _() {
            var titleTextEl,
                infoTextEl;

            _.super(this);
            titleTextEl = this.querySelector('.title-text');
            infoTextEl = this.querySelector('.info-text');
            if (titleTextEl) {
                cachedTitleText = titleTextEl.textContent;
            }
            if (infoTextEl) {
                cachedInfoText = infoTextEl.textContent;
            }
            cachedItems = Array.prototype.slice.call(this.querySelectorAll('ha-page-modal-header-item'));
            //This is a workaround for an IE issue. It would be simpler to use a :not selector, but IE throws
            //a syntax error when used in conjunction with the above selector.
            cachedItems = cachedItems.filter(function(element) {
                return element.getAttribute('type') !== 'close';
            });
        },

        postRender: function _() {
            _.super();
            if (!this.headerItems.length && cachedItems.length) {
                this.headerItems = cachedItems;
            }
            if (cachedTitleText) {
                this.titleText = cachedTitleText;
            }
            if (cachedInfoText) {
                this.infoText = cachedInfoText;
            }
        },

        /**
         * If the clicked button isn't the close button,
         * calls the method 'unselect' of this component
         * and then calls the method 'select' of the Page Modal Header Item.
         * @param {HTMLElement} target The item to select.
         */
        select: function(target) {
            var isCloseButton = target.getAttribute('type');

            if (isCloseButton !== 'close') {
                this.unselect();
                target.select();
            }
        },

        /**
         * If there is a selected item, calls the method 'unselect' of the Page Modal Header Item.
         */
        unselect: function() {
            var currentSelected = this.querySelector('.selected');

            if (currentSelected) {
                currentSelected.unselect();
            }
        }

    });

    return register('ha-page-modal-header', HAPageModalHeader);
});


define('text!hui/trowser/page-modal.html',[],function () { return '<template>\n    <div class="page-modal-panel" aria-hidden="true">\n        <header>\n        </header>\n        <section tabindex="-1">\n        </section>\n        <footer>\n        </footer>\n    </div>\n</template>\n';});


define('hui/trowser/page-modal',[
    'object-utils/classes',
    'register-component/v2/UIComponent',
    'register-component/v2/register',
    'register-component/template!./page-modal.html',
    '../core/contentNode',
    '../core/a11y',
    '../core/keys',
    '../core/underlay',
    '../core/utils'
], function(classes, UIComponent, register, template, ContentNode, a11y, keys, underlay, utils) {
    'use strict';

    /**
     * Used to track whether the transition has ended or not
     * @type {String}
     * @private
     */
    var _animationend,

        /**
         * Map that says where  to insert the content that
         * the consumer sends on the initialization.
         * @type {Object}
         */
        contentPropertyMap = {
            'header': 'header',
            'section': 'section',
            'footer': 'footer'
        },

        _replaceContent = function(component, selector, content) {
            var container = component.querySelector(selector),
                contentList = [].concat(content),
                oldContent = container.children;
            utils.removeNodesSafe(container, oldContent);
            utils.appendChildCollection(container, contentList);
        },

        HAPageModal = classes.createObject(UIComponent, {

            init: function _() {
                _.super(this);

                /**
                 * Template of the element.
                 * @type {String}
                 */
                this.template = template;

                /**
                 * Used for accessibility reasons to set the focus to the last active element
                 * before the PageModal appearance.
                 * @type {HTMLElement}
                 */
                this.lastFocus = null;

                ContentNode.cacheInputContent(this, contentPropertyMap);

                this.setupProperties({

                    /**
                     * Indicates whether the component is visible after calling show
                     * @type {Boolean}
                     */
                    visible: {
                        type: Boolean,
                        default: false
                    }
                });
            },

            get header() {
                return this._header;
            },

            get section() {
                return this._section;
            },

            get footer() {
                return this._footer;
            },

            set header(content) {
                _replaceContent(this, 'header', content);
                this._header = content;
            },

            set section(content) {
                _replaceContent(this, 'section', content);
                this._section = content;
            },

            set footer(content) {
                _replaceContent(this, 'footer', content);
                this._footer = content;
            },

            createdCallback: function _() {
                _.super(this);
                this.tabIndex = '-1';
                this.role = 'dialog';
                _animationend = 'webkitTransitionName' in this.ownerDocument.documentElement.style ? 'webkitTransitionEnd' : 'animationend';
            },

            postRender: function _() {
                _.super(this);
                ContentNode.storeCachedInput(this, contentPropertyMap);
            },

            show: function() {
                var pageModal,
                    self = this;
                if (!this.visible) {
                    this.visible = true;

                    this.classList.remove('slide-out');
                    this.classList.add('slide-in');
                    this.ownerDocument.body.classList.add('modal-open');
                    underlay.show(this);
                    this.lastFocus = this.ownerDocument.activeElement;
                    pageModal = this.querySelector('.page-modal-panel');
                    pageModal.setAttribute('aria-hidden', false);
                    a11y.setFocusOnFirst(this);

                    this.on('keydown', function(evt) {
                        if (evt.keyCode === keys.ESCAPE) {
                            evt.stopPropagation();
                            evt.preventDefault();
                            self.close();
                        }
                        if (keys.TAB === evt.keyCode) {
                            a11y.keepFocusInsideListener(evt, self);
                        }
                    });

                    this.on('ha-page-modal-header:dismiss', function() {
                        self.close();
                    });

                    this.emit('show', {target: this});
                }
            },

            /**
             * @deprecated Use the header, section and footer properties instead
             * Sets the content of the page modal
             */
            addContent: function(config) {
                ContentNode.addContent(this, config, contentPropertyMap);
                console.warn('DEPRECATION WARNING: addContent method should not be used anymore to add ' +
                'content to the component. This will be removed in the future so please assign content ' +
                'directly to the corresponding component properties instead.');
            },

            /**
             * @deprecated Use close method instead
             * Hides the Page Modal component
             */
            hide: function() {
                this.close();
                console.warn('DEPRECATION WARNING: The hide method is deprecated, use "close" method instead');
            },

            /**
             *  Hide the Page Modal component.
             *  @emits  ha-page-modal:close
             */
            close: function() {
                var pageModal,
                    pageModalHeader,
                    self = this;

                if (this.visible) {
                    this.visible = false;
                    pageModal = this.querySelector('.page-modal-panel');
                    pageModal.setAttribute('aria-hidden', true);

                    pageModalHeader = this.querySelector('ha-page-modal-header');

                    if (pageModalHeader) {
                        pageModalHeader.unselect();
                    }

                    this.off('keydown');
                    this.off('ha-page-modal-header:dismiss');

                    underlay.hide();

                    this.classList.remove('slide-in');
                    this.classList.add('slide-out');
                    this.ownerDocument.body.classList.remove('modal-open');

                    this.on(_animationend, function onHide() {
                        self.classList.remove('slide-out');
                        self.stopListening(pageModal, _animationend, onHide);
                        if (this.lastFocus) {
                            this.lastFocus.focus();
                        }
                        this.lastFocus = null;
                    });
                    this.emit('close', {target: pageModal});
                }
            }
        });

    return register('ha-page-modal', HAPageModal);
});

define('hui/trowser',[
        'object-utils/classes',
        'register-component/v2/register',
        './trowser/trowser-base',
        './trowser/page-modal-footer',
        './trowser/page-modal-header-item',
        './trowser/page-modal-header',
        './trowser/page-modal'
    ],
    function(classes, register, TrowserBase) {
        'use strict';

        var HATrowser = classes.createObject(TrowserBase, {

            init: function _() {
                _.super(this);

                this.contentSelectorMap = {
                    'section': 'section',
                    'footer': 'footer'
                };
            }

        });

        return register('ha-trowser', HATrowser);
    })
;

define('hui/tab',[
    'register-component/v2/register',
    'object-utils/classes',
    'register-component/v2/UIComponent',
    './core/utils'
], function(register, classes, UIComponent, utils) {
    'use strict';

    function _createContent(component) {
        var content;
        content = component.ownerDocument.createElement('div');
        content.className = 'content';
        component.appendChild(content);

        return content;
    }

    var HATab = classes.createObject(UIComponent, {

        init: function _() {

            _.super(this);
            this._section = null;
            this.setupProperties({
                /**
                 * The icon to be shown.
                 * @type {String}
                 */
                icon: {
                    default: '',
                    change: function(newValue) {
                        var iconEl = this.querySelector('i'),
                            content = this.querySelector('.content'),
                            lastIcon,
                            titleSpan;

                        if (newValue) {
                            this.classList.add('tab-icon');
                            titleSpan = this.querySelector('span');

                            if (!content) {
                                content = _createContent(this);
                            }

                            if (!iconEl) {
                                iconEl = this.ownerDocument.createElement('i');
                                iconEl.classList.add('hi');

                                if (titleSpan) {
                                    content.insertBefore(iconEl, titleSpan);
                                } else {
                                    content.appendChild(iconEl);
                                }
                            }

                            if (iconEl.classList.length > 1) {
                                lastIcon = iconEl.classList[iconEl.classList.length - 1];
                                iconEl.classList.remove(lastIcon);
                            }

                            iconEl.classList.add(newValue);
                        } else {
                            this.classList.remove('tab-icon');
                            if (iconEl) {
                                content.removeChild(iconEl);
                            }
                        }
                    }
                },

                /**
                 * The title that the tab should show.
                 * @type {String}
                 */
                titleText: {
                    default: '',
                    change: function(newValue) {
                        var titleSpan = this.querySelector('.content>span'),
                            titleStrong = this.querySelector('.content>strong'),
                            isActive = this.classList.contains('active'),
                            content = this.querySelector('.content');

                        if (newValue) {
                            if (!content) {
                                content = _createContent(this);
                            }

                            if (!titleSpan && !titleStrong) {

                                titleSpan = this.ownerDocument.createElement('span');
                                titleSpan.textContent = newValue;

                                titleStrong = this.ownerDocument.createElement('strong');
                                titleStrong.textContent = newValue;

                                content.appendChild(titleSpan);
                                content.appendChild(titleStrong);

                            } else {
                                titleSpan.textContent = newValue;
                                titleStrong.textContent = newValue;
                            }

                            if (isActive) {
                                titleSpan.setAttribute('aria-hidden', true);
                                titleStrong.setAttribute('aria-hidden', false);
                            } else {
                                titleSpan.setAttribute('aria-hidden', false);
                                titleStrong.setAttribute('aria-hidden', true);
                            }
                        } else if (titleSpan && titleStrong) {
                            titleStrong.innerHTML = '';
                            titleSpan.innerHTML = '';
                        }
                    }
                }
            });

        },

        /**
         * The content that the consumer passthrough.
         * We need to cached here so then the ha-tabs can move it to the
         * right place.
         * @protected
         * @type {Array}
         * @emits section-property-change
         */
        set section(content) {

            if (!Array.isArray(content)) {
                content = [content];
            }

            this._section = content;

            this.emit('section-property-change');
        },

        get section() {
            return this._section;
        },

        preRender: function _() {
            _.super(this);
        },

        postRender: function _() {
            var elementsArray,
            i,
            component,
            sectionSelector;

            _.super(this);

            this.setAttribute('role', 'tab');

            elementsArray = [];

            for (i = 0; i < this.childNodes.length; i++) {
                if (!this.childNodes[i].classList || !this.childNodes[i].classList.contains('content')) {
                    elementsArray.push(this.childNodes[i]);
                }
            }

            /* This component has a different behavior than the rest. Html elements from 'section'
            property, are moved to the corresponding section on the parent 'ha-tabs'. For that reason,
            we need to search for the elements.
            */
            if (elementsArray.length === 0 && this.id) {
                component = utils.getComponentFromElement(this, 'HA-TABS');
                sectionSelector = '#' + this.getAttribute('aria-controls');

                this.section = [].slice.call(component.querySelector(sectionSelector).childNodes);
            } else {
                this.section = elementsArray;
            }
        }
    });

    return register('ha-tab', HATab);
});

define('hui/tabs',[
    'register-component/v2/register',
    'object-utils/classes',
    'register-component/v2/UIComponent',
    './core/a11y',
    './core/keys',
    './core/utils',
    './tab'
], function(register, classes, UIComponent, a11y, keys, utils) {
    'use strict';

    /**
     * Create contents and inserts into the ha-tabs HTML
     * the content for the given tab.
     * @param {HTMLElement} tabInput ha-tab element.
     * @param {Number} indexTab The index of current tab.
     * @param {HTMLElement} component The ha-tabs component.
     * @private
     */
    function _createContent(tabInput, indexTab, component) {
        var contentSectionEl = component.querySelector('section'),
            isActive = _isActive(indexTab, component),
            tabContentEl,
            sectionContainerID,
            i;

        sectionContainerID = _getTabContentId(indexTab, component);
        tabContentEl = component.querySelector('#' + sectionContainerID);

        if (!tabContentEl) {
            tabContentEl = component.ownerDocument.createElement('div');
            contentSectionEl.appendChild(tabContentEl);
            tabContentEl.id = sectionContainerID;

            tabContentEl.setAttribute('aria-labelledby', _getTabId(indexTab, component));
            tabContentEl.setAttribute('role', 'tabpanel');
        }

        tabContentEl.setAttribute('aria-hidden', !isActive);

        if (isActive) {
            tabContentEl.classList.add('active');
        } else {
            tabContentEl.classList.remove('active');
        }

        if (tabInput.section) {
            tabContentEl.innerHTML = '';
            for (i = 0; i < tabInput.section.length; i++) {
                tabContentEl.appendChild(tabInput.section[i]);
            }

            _findFocusableJumpers(component, indexTab, tabContentEl);

            _jumpersOnKeydown(component, indexTab);
        }
    }

    /**
     * Given an index retrieves a safe one.
     * @param  {Number} index The index to check.
     * @param  {HTMLElement} component The component to inspect on.
     * @return {Number} The safe index.
     * @private
     */
    function _getSafeIndex(index, component) {
        return index === 0 ? 0 : (!index || !component.tabs || index > component.tabs.length) ? -1 : index;
    }

    /**
     * Select the new tab on the component and deselect the previous one.
     * @param {Object} activeTab The tab that will replace the previous selected.
     * @param {HTMLElement} component The ha-tabs component.
     * @private
     */
    function _selectTab(activeTab, component) {
        if (!activeTab) {
            return;
        }

        activeTab = utils.getComponentFromElement(activeTab, 'HA-TAB');

        var previousActiveTab = component.querySelector('.ha-tabs-header .active');
        _toggleNodeSelected(previousActiveTab, component);
        _toggleNodeSelected(activeTab, component);
        component.selectedIndex = component.tabs.indexOf(activeTab);
        activeTab.focus();
    }

    /**
     * Given an index tab return if is active by two basic rules:
     * 1) If the selectedIndex is greater than 0, means that was defined and then will
     * be validated by the given indexTab.
     * 2) If selectedIndex is not defined or is just the default, the active tab would
     * be the first.
     * @param {Number} indexTab The current index tab.
     * @param {HTMLElement} component The ha-tabs component.
     * @returns {boolean} Returns whether the indexTab should be active or not.
     * @private
     */
    function _isActive(indexTab, component) {
        if (component.selectedIndex > 0) {
            return component.selectedIndex === indexTab;
        } else {
            return indexTab === 0;
        }
    }

    /**
     * Return the tab index from the for attribute from the given tag.
     * @param {Object} tab The html element that is used to subtract the tab index id.
     * @returns {Number} the index of tab.
     * @private
     */
    function _retrieveIndexTab(tab) {
        return parseInt(tab.forHTML.slice(-1), 10);
    }

    /**
     * Return the proper format of tab content id.
     * @param {Number} indexTab The current index tab.
     * @param {Object} component The object that contain the component id.
     * @returns {String} The tab content id.
     * @private
     */
    function _getTabContentId(indexTab, component) {
        if (component.tabs[indexTab] && component.tabs[indexTab].hasAttribute('aria-controls')) {
            return component.tabs[indexTab].getAttribute('aria-controls');
        } else {
            return 'ha-tab-content-' + component.componentId + '-' + indexTab;
        }
    }

    /**
     * Return the proper format of tab id.
     * @param {Number} indexTab The current index tab.
     * @param {Object} component The object that contain the component id.
     * @returns {String} The tab id.
     * @private
     */
    function _getTabId(indexTab, component) {
        if (component.tabs[indexTab] && component.tabs[indexTab].id) {
            return component.tabs[indexTab].id;
        } else {
            return 'ha-tab-' + component.componentId + '-' + indexTab;
        }
    }

    /**
     * Invert the status of the defined component.
     * @param {Object} node The object that contain the style that will be toggled.
     * @param {Object} component The ha-tabs object.
     * @private
     */
    function _toggleNodeSelected(node, component) {
        if (node) {
            var contentId = node.forHTML,
                content = component.querySelector('#' + contentId),
                isNodeActive = node.classList && node.classList.contains('active');

            if (!content) {
                return;
            }
            if (isNodeActive) {
                node.classList.remove('active');
                node.setAttribute('aria-selected', false);
                node.setAttribute('aria-expanded', false);
                node.setAttribute('tabindex', -1);
                content.classList.remove('active');
                content.setAttribute('aria-hidden', true);
            } else {
                node.classList.add('active');
                node.setAttribute('aria-selected', true);
                node.setAttribute('aria-expanded', true);
                node.setAttribute('tabindex', 0);
                content.classList.add('active');
                content.setAttribute('aria-hidden', false);
            }
        }
    }

    /**
     * Goes over all the tabs finding the last focusable element on each of them.
     * @param {HTMLElement} component The component to be inspected.
     * @param {Number} tabIndex Index of the tab to search for tabbable elements
     * @return {Object} The array of last focusable element on each contentNode.
     * @private
     */
    function _findFocusableJumpers(component, tabIndex, content) {
        var elements;

        elements = a11y.getBoundariesTabableElement(content, true);
        component.jumpers[tabIndex] = elements.last || elements.first;
    }

    /**
     * Given a list of jumper elements we attach the evt to jump to the next tab
     * when the key tab is pressed over them.
     * @param {HTMLElement} component The ha-tabs component.
     * @param {Number} tabIndex Optional. Index of tab to update jumpers
     * @private
     */
    function _jumpersOnKeydown(component, tabIndex) {

        function moveFocusCallback(evt) {
            var component = utils.getComponentFromElement(evt.target, 'HA-TABS');

            if (evt.keyCode === keys.TAB && !evt.shiftKey) {
                _moveFocus(evt.target.jumpTo, component, evt);
            }
        }

        function setListener(component, tabNumber) {
            element = component.jumpers[tabNumber];
            nextTab = component.querySelector('#' + _getTabId(parseInt(tabNumber, 10) + 1, component));

            // if there isn't next tab we just let the focus go away
            if (nextTab) {
                // if there is a focusable element in this panel we attach the evt
                // if not, the event will be added later to the tab itself
                if (element) {
                    element.jumpTo = nextTab;
                    component.stopListening(element, 'keydown', moveFocusCallback);
                    component.listenTo(element, 'keydown', moveFocusCallback);
                }
            }
        }

        var element, tabNumber, nextTab;

        if (tabIndex) {
            setListener(component, tabIndex);
        } else {
            for (tabNumber in component.jumpers) {
                setListener(component, tabNumber);
            }
        }
    }

    /**
     * Either there is a jumper or not, it moves the focus to the correct place.
     * The jumper if there is one, or the next tab.
     * @param {HTMLElement} nextTab   The next tab to be highlighted.
     * @param {HTMLElement} component The ha-tabs component.
     * @param {Event} evt The event to be stopped.
     * @param {HTMLElement} jumper (optional) The jumper to place the focus on.
     * @private
     */
    function _moveFocus(nextTab, component, evt, jumper) {
        if (nextTab) {
            utils.stopEvent(evt);
            _selectTab(nextTab, component);

            if (jumper) {
                jumper.focus();
            } else {
                nextTab.focus();
            }
        }
    }

    function updateTab(evt) {
        var HATab = evt.target,
            index = -1,
            i,
            component;

        component = utils.getComponentFromElement(HATab, 'HA-TABS');

        for (i = 0; i < component.tabs.length; i++) {
            if (component.tabs[i] === HATab) {
                index = i;
                break;
            }
        }

        _createContent(HATab, index, component);
    }

    function updateHATab(component, indexTab) {
        var isActive,
            tabInput;

        tabInput = component._tabs[indexTab];

        tabInput.id = _getTabId(indexTab, component);

        tabInput.forHTML = _getTabContentId(indexTab, component);

        tabInput.setAttribute('aria-controls', _getTabContentId(indexTab, component));

        isActive = _isActive(indexTab, component);

        tabInput.setAttribute('aria-selected', isActive);
        tabInput.setAttribute('aria-expanded', isActive);

        if (isActive) {
            tabInput.classList.add('active');
        } else {
            tabInput.classList.remove('active');
        }

        component.querySelector('header').appendChild(tabInput);

        _createContent(tabInput, indexTab, component);
    }

    var HATabs = classes.createObject(UIComponent, {

        init: function _() {

            _.super(this);

            this.jumpers = {};

            this._tabs = null;

            this.setupProperties({
                /**
                 * The current index of the component.
                 * @type {Number}
                 */
                selectedIndex: {
                    default: 0,
                    change: function(newValue) {
                        var safeIndex = _getSafeIndex(newValue, this),
                            tab;

                        if (this.tabs && safeIndex !== -1) {
                            tab = this.tabs[newValue];
                            if (tab && !tab.classList.contains('active')) {
                                _selectTab(tab, this);
                            }
                        }
                    }
                }
            });

        },

        /**
         * The models of each tabs.
         * @type {Array}
         */
        set tabs(newValue) {
            var indexTab;

            this.querySelector('header').innerHTML = '';
            this.querySelector('section').innerHTML = '';

            this._tabs = newValue || [];

            for (indexTab = 0; indexTab < this._tabs.length; indexTab++) {
                updateHATab(this, indexTab);

                this.listenTo(this._tabs[indexTab], 'section-property-change', updateTab);
            }

            _jumpersOnKeydown(this);
        },

        get tabs() {
            return this._tabs;
        },

        /**
         * The current tab selected.
         * NOTE: by default is null
         */
        get selectedItem() {
            return this._tabs[this.selectedIndex];
        },

        /**
         * Empty method to avoid problems with getter without setters
         */
        set selectedItem(newValue) {
            // jshint unused:false
        },

        postRender: function _() {
            _.super(this);

            var headerEl = this.querySelector('header'),
                sectionEl = this.querySelector('section'),
                isAlreadyRendered = this.querySelector('.ha-tabs-content') !== null,
                indexTab,
                tabs;

            if (isAlreadyRendered) {
                this._tabs = [].slice.call(this.querySelectorAll('ha-tab'));
                for (indexTab = 0; indexTab < this._tabs.length; indexTab++) {
                    updateHATab(this, indexTab);

                    this.listenTo(this._tabs[indexTab], 'section-property-change', updateTab);
                }

                _jumpersOnKeydown(this);
            } else {
                headerEl = this.ownerDocument.createElement('header');
                headerEl.classList.add('ha-tabs-header');
                headerEl.setAttribute('role', 'tablist');

                sectionEl = this.ownerDocument.createElement('section');
                sectionEl.classList.add('ha-tabs-content');

                this.appendChild(headerEl);
                this.appendChild(sectionEl);

                tabs = this.querySelectorAll('ha-tab');
                this.tabs = utils.removeNodesSafe(this, tabs);

                this.tabIndex = '-1';
            }
        },

        /**
         * Add a new tab at the end of the list of existing tabs. You can optionaly
         * define the position index of the new tag.
         * @param {Object} tab The new tab that will be add to the component.
         * @param {Number} index (optional) the index position of the new tab.
         */
        add: function(tab, index) {
            var safeIndex,
                tabsLength = this.tabs.length,
                newTabs;

            if (tab && tab.tagName === 'HA-TAB') {
                safeIndex = (index === 0) ? 0 : (!index) ? tabsLength : index;
                newTabs = this.tabs;
                newTabs.splice(safeIndex, 0, tab);
                this.tabs = newTabs;
            }
        },

        /**
         * Remove the tab by index.
         * @param {Number} index The index of tab that will be removed.
         */
        remove: function(index) {
            var safeIndex = _getSafeIndex(index, this),
                newTabs;

            if (safeIndex !== -1) {
                newTabs = this.tabs;
                newTabs.splice(safeIndex, 1);
                this.tabs = newTabs;
            }
        },

        /**
         * Once the Horizontal Tab has been attached to the DOM, click
         * evt handlers are bound.
         * @override
         */
        createdCallback: function _() {
            _.super(this);

            this.on('header ha-tab:click', function(evt) {
                _selectTab(evt.target, this);
                this.emit('select');
            }.bind(this));

            this.on('header ha-tab:keydown', function(evt) {
                var currentTab = evt.target,
                    nextTab, tabOrder,
                    prevTabOrder, nextTabOrder;

                if (evt.keyCode === keys.TAB) {
                    tabOrder = _retrieveIndexTab(currentTab);

                    if (evt.shiftKey) {
                        prevTabOrder = tabOrder - 1;

                        // Should set the focus to the previus jumper if there is one.
                        // If not, the focus just goes away naturally.
                        if (prevTabOrder >= 0) {
                            nextTab = this.querySelector('#' + _getTabId(prevTabOrder, this));

                            if (this.jumpers.hasOwnProperty(prevTabOrder) && this.jumpers[prevTabOrder]) {
                                _moveFocus(nextTab, this, evt, this.jumpers[prevTabOrder]);
                            } else {
                                _moveFocus(nextTab, this, evt);
                            }
                        }
                    } else {
                        nextTabOrder = tabOrder + 1;
                        // The following case, just happen when there is not a jumper within the tab content.
                        // Then we need to jump to the next tab from the current one.
                        if (nextTabOrder < Object.keys(this.tabs).length) {
                            nextTab = this.querySelector('#' + _getTabId(nextTabOrder, this));
                            // if the current tab doesn't have a jumper we should move the focus to next tab
                            if (Object.keys(this.jumpers).length === 0 ||
                                (this.jumpers.hasOwnProperty(tabOrder) && !this.jumpers[tabOrder])) {
                                _moveFocus(nextTab, this, evt);
                            }
                        }
                    }

                } else if (evt.keyCode === keys.LEFT && currentTab.previousElementSibling) {
                    nextTab = currentTab.previousElementSibling;
                    _moveFocus(nextTab, this, evt);
                } else if (evt.keyCode === keys.RIGHT && currentTab.nextElementSibling) {
                    nextTab = currentTab.nextElementSibling;
                    _moveFocus(nextTab, this, evt);
                }

            }.bind(this));
        }
    });

    return register('ha-tabs', HATabs);
});
define('hui/inline-message',[
    'register-component/v2/UIComponent',
    'register-component/v2/register',
    'object-utils/classes',
    './core/popup',
    './core/tooltip'
], function(UIComponent, register, classes, popup, coreTooltip) {
    'use strict';

    /**
     * Normalize animation event names.
     * @returns {object} The names for the animation events in the current execution environment
     */
    function _getAnimationEvents() {
        var animationStartEventName =
            'webkitAnimationName' in document.documentElement.style ?
                    'webkitAnimationStart' : 'animationstart',
            animationEndEventName =
                'webkitAnimationName' in document.documentElement.style ?
                        'webkitAnimationEnd' : 'animationend';

        return {
            animationstart: animationStartEventName,
            animationend: animationEndEventName
        };
    }

    /**
     * Event handler for 'animationend'
     * @param {AnimationEvent} event
     */
    function _handleAnimationEnd(event) {
        var eventName = event.animationName,
            target = event.target;

        switch (eventName) {
            case 'ha-fade-in':
                target.classList.remove('enter');
                target.emit('show');
                break;

            case 'ha-fade-out':
                target.classList.remove('visible');
                target.classList.remove('leave');
                target.emit('close');
                break;
        }
    }

    /**
     * Adds/removes connector element inside component
     * @param  {HTMLElement} component Where to add the element
     */
    function updateConnector(component) {
        var connectorNode = component.querySelector('.connector'),
            targetNode,
            restOfSelector;

        if (component.targetSelector.indexOf('_previousSibling') > -1) {
            restOfSelector = component.targetSelector.split('_previousSibling')[1];
            if (restOfSelector) {
                targetNode = component.previousElementSibling.querySelector(restOfSelector.trim());
            } else {
                targetNode = component.previousElementSibling;
            }
        } else if (component.targetSelector !== '') {
            targetNode = component.ownerDocument.querySelector(component.targetSelector);
        }

        if (!targetNode) {
            if (connectorNode) {
                component.removeChild(connectorNode);
            }

            return;
        }

        if (!connectorNode) {
            connectorNode = component.ownerDocument.createElement('div');
            connectorNode.classList.add('connector');
            component.insertBefore(connectorNode, component.firstChild);
        }
    }

    var HAInlineMessage;

    HAInlineMessage = classes.createObject(UIComponent, /** @lends HAInlineMessage# */ {

        /** @constructs */
        init: function _() {
            _.super(this);

            var anim = _getAnimationEvents();

            this.on(anim.animationend, _handleAnimationEnd);
            this._listenersTargets = [];
            this._message = null;

            // Keep bound references to these callbacks for core/tooltip methods to use
            this._hideCallback = this.close.bind(this);
            this._showCallback = this.show.bind(this);

            this.setupProperties({
                /**
                 * If the element has a target, this property specifies whether it should auto-close on the condition
                 * specified in the 'trigger' property.
                 * @type {boolean}
                 * @default false
                 */
                autoClose: {
                    type: Boolean,
                    default: false,
                    change: function(newValue) {
                        this._dismissible = !newValue;
                    }
                },

                /**
                 * Position of the element relative to its target (when in tooltip mode).
                 * top, bottom, left, right
                 * Multiple values can be separated by a space; they will be tried in the order specified.
                 * @type {string}
                 * @default 'right bottom'
                 */
                position: {
                    type: String,
                    default: 'right bottom',
                    change: function(newValue) {
                        var alignmentMap = {
                            bottom: 'left',
                            top: 'left',
                            left: 'middle',
                            right: 'middle'
                        };

                        this._alignment = newValue.split(' ').map(function(position) {
                            return alignmentMap[position];
                        }).join(' ');
                    }
                },

                /**
                 * The CSS selector for the target element to display the message next to
                 * Defaults to empty, which means the element must be manually placed.
                 * The special value '_previousSibling' can be used to indicate the 'previousElementSibling' in the DOM
                 * should be used.
                 * @type {string}
                 * @default ''
                 */
                targetSelector: {
                    type: String,
                    default: '',
                    change: function(newValue) {
                        coreTooltip.removeOldListeners(this);

                        if (newValue) {
                            this.classList.remove('visible');
                            this.classList.remove('static');
                            coreTooltip.setTooltipTargets(this, newValue);
                            coreTooltip.resetListeners(this, this.trigger);
                        } else {
                            this.classList.add('static');
                            this.classList.add('visible');
                            this._listenersTargets = [];
                        }
                    }
                },

                /**
                 * Name of event to listen for on target to show/close the element.
                 * Supported values: focus, hover
                 * The value 'custom' indicates that the developer will control showing and closing the element.
                 * @type {string}
                 * @default custom
                 */
                trigger: {
                    type: String,
                    default: 'custom',
                    change: function(newValue) {
                        coreTooltip.resetListeners(this, newValue);
                    }
                }
            });
        },

        /**
         * Sets tooltip initial configs and resets event listeners.
         */
        attachedCallback: function() {
            if (this.targetSelector) {
                coreTooltip.setTooltipTargets(this, this.targetSelector);
                coreTooltip.resetListeners(this, this.trigger);
            }
        },

        postRender: function _() {
            var contentNode,
                iconNode,
                messageContent;

            _.super(this);

            iconNode = this.querySelector('.hi');
            contentNode = this.querySelector('.message-content');

            if (contentNode) {
                messageContent = contentNode.innerHTML;
            } else {
                messageContent = this.innerHTML;
                this.innerHTML = '';
            }

            if (!iconNode) {
                iconNode = this.ownerDocument.createElement('i');
                iconNode.classList.add('hi');
                iconNode.classList.add('hi-circle-check');
                iconNode.setAttribute('aria-hidden', true);
                this.appendChild(iconNode);
            }

            if (!contentNode) {
                contentNode = this.ownerDocument.createElement('div');
                contentNode.classList.add('message-content');

                this.appendChild(contentNode);
            }

            // Set 'minWidth' to avoid popup default behaviour of setting 'minWidth' to
            // target's width
            this.style.minWidth = '1px';

            this.setAttribute('role', 'tooltip');
            this.setAttribute('aria-live', 'polite');
            this.message = messageContent;
            this.tabIndex = -1;
        },

        // Necessary for core/popup methods
        get alignment() {
            return this._alignment;
        },

        // Necessary for core/tooltip methods
        get dismissible() {
            return this._dismissible;
        },

        // Necessary for core/tooltip methods
        get duration() {
            return 0;
        },

        /**
         * The 'message' property contains the content displayed in the component
         * @param {string} newValue Text or HTML string of content to display
         */
        set message(newValue) {
            var contentNode = this.querySelector('.message-content');

            if (typeof newValue === 'string') {
                contentNode.innerHTML = newValue;
                this._message = newValue;
            } else if (newValue.nodeType) {
                contentNode.innerHTML = '';
                contentNode.appendChild(newValue);
                this._message = newValue;
            }
        },

        /**
         * The 'message' property contains the content displayed in the component
         * @returns {string} Text or HTML string of the currently displayed content
         */
        get message() {
            return this._message;
        },

        /**
         * Close the element
         * @emits InlineMessage#close
         */
        close: function() {
            this.classList.add('leave');
            if (this._target && this._target.focus) {
                this._target.focus();
            }
            this._target = null;
        },

        /**
         * Show the element
         * @emits InlineMessage#show
         */
        show: function() {
            if (this.classList.contains('visible')) {
                return;
            }

            if (this.targetSelector) {
                updateConnector(this);

                if (this.querySelector('.connector')) {
                    if (this.targetSelector.indexOf('_previousSibling') > -1) {
                        var restOfSelector = this.targetSelector.split('_previousSibling')[1];
                        if (restOfSelector) {
                            this._target = this.previousElementSibling.querySelector(restOfSelector.trim()) || this.previousElementSibling;
                        } else {
                            this._target = this.previousElementSibling;
                        }
                    } else {
                        this._target = this.ownerDocument.querySelector(this.targetSelector);
                    }

                    if (this._target) {
                        popup.setPosition(this, this._target, this.position.split(' '), this.alignment.split(' '));
                    }
                }
            }

            this.classList.remove('leave');
            this.classList.add('enter');
            this.classList.add('visible');
        }
    });

    return register('ha-inline-message', HAInlineMessage);
});

define('hui/page-message',[
    'register-component/v2/UIComponent',
    'register-component/v2/register',
    'object-utils/classes'
], function(UIComponent, register, classes) {
    'use strict';

    var HAPageMessage;

    /**
     * When a message is closed, finds a new target to give focus to
     * @param  {HTMLElement} component The page message component
     */
    function _handleFocusOnClose(component) {
        var destinationFocus;

        destinationFocus = component.previousElementSibling || component.parentElement.previousElementSibling;
        if (destinationFocus) {
            destinationFocus.focus();
        }
    }

    HAPageMessage = classes.createObject(UIComponent, {

        /**
         * Executed on show message.
         * @emits PageMessage#show
         */
        show: function() {
            this.classList.remove('hidden');
            this.emit('show');
        },

        init: function _() {
            _.super(this);

            /**
             * Content of the message
             */
            this._message = null;

            /**
             * Show a close button.
             * @type {Boolean}
             */
            this._dismissible = true;

            this.setupProperties({
                /**
                 * Title of the message.
                 * @type {String}
                 */
                titleText: {
                    default: '',
                    type: String,
                    change: function(newValue) {
                        var headerNode = this.querySelector('header'),
                            textContainer = this.querySelector('h4');

                        if (newValue) {
                            if (!headerNode) {
                                headerNode = this.ownerDocument.createElement('header');
                                textContainer = this.ownerDocument.createElement('h4');

                                headerNode.appendChild(textContainer);
                                this.insertBefore(headerNode, this.querySelector('.message-content'));
                            }
                            textContainer.textContent = newValue;
                            this.setAttribute('aria-label', newValue);
                        } else {
                            if (headerNode) {
                                this.removeChild(headerNode);
                            }
                            this.removeAttribute('aria-label');
                        }
                    }
                },

                /**
                 * Type of the message:
                 *  - info
                 *  - warn
                 *  - alert for backward compatibility
                 *  - error
                 * @type {String}
                 * @default: info
                 */
                type: {
                    default: 'info',
                    type: String,
                    change: function(newValue) {
                        var iconEl = this.querySelector('span.message-icon');

                        if (newValue === 'alert' || newValue === 'warn' || newValue === 'error') {
                            iconEl.className = 'message-icon hi hi-circle-alert';
                        } else if (newValue === 'discovery') {
                            iconEl.className = 'message-icon hi hi-lightbulb-o';
                        } else {
                            iconEl.className = 'message-icon hi hi-circle-info';
                        }
                        if (newValue === 'alert') {
                            console.warn('DEPRECATION WARNING: The "alert" type is going to be deprecated. From now on, please use "error" type instead.');
                        }
                    }
                }
            });

            /**
             * Executed when the user click on close button.
             * @emits PageMessage#dismiss
             */
            this.on('button.btn.hi-close:click', function() {
                this.emit('dismiss');
                this.close();
            }.bind(this));
        },

        set message(newValue) {
            var content = this.querySelector('.message-content');
            if (typeof newValue === 'string') {
                content.innerHTML = newValue;
                this._message = newValue;
            } else if (newValue.nodeType) {
                content.innerHTML = '';
                content.appendChild(newValue);
                this._message = newValue;
            }
        },

        get message() {
            return this._message;
        },

        /**
         * Show a close button.
         * @type {Boolean}
         */
        set dismissible(newValue) {
            var closeButton = this.querySelector('button');
            if (newValue) {
                closeButton.classList.add('show');
                closeButton.removeAttribute('aria-hidden');
            } else {
                closeButton.classList.remove('show');
                closeButton.setAttribute('aria-hidden', true);
            }
            this._dismissible = newValue;
        },

        get dismissible() {
            return this._dismissible;
        },

        /**
         * Callback attached after the Component render
         * Set the attributes for the component.
         */
        postRender: function _() {
            var contentEl = this.querySelector('.message-content'),
                typeIconEl = this.querySelector('span.message-icon'),
                titleEl = this.querySelector('h4'),
                closeButtonEl = this.querySelector('button'),
                headerEl,
                messageContent;

            _.super(this);
            if (contentEl) {
                messageContent = contentEl.innerHTML;
            } else {
                messageContent = this.innerHTML;

                this.innerHTML = '';

                closeButtonEl = this.ownerDocument.createElement('button');
                closeButtonEl.className = 'btn hi hi-close';
                closeButtonEl.setAttribute('aria-hidden', true);
                closeButtonEl.setAttribute('aria-label', 'close');

                contentEl = this.ownerDocument.createElement('div');
                contentEl.className = 'message-content';
                headerEl = this.ownerDocument.createElement('header');

                if (!typeIconEl) {
                    typeIconEl = this.ownerDocument.createElement('span');
                    typeIconEl.classList.add('message-icon');
                }

                typeIconEl.setAttribute('aria-hidden', true);

                titleEl = this.ownerDocument.createElement('h4');

                headerEl.appendChild(titleEl);

                this.appendChild(typeIconEl);
                this.appendChild(headerEl);
                this.appendChild(contentEl);
                this.appendChild(closeButtonEl);
            }

            this.setAttribute('role', 'alert');
            this.dismissible = this.getAttribute('dismissible') !== 'false';
            this.message = messageContent;
            this.tabIndex = -1;
        },

        /**
         * Hides the element.
         * @emits PageMessage#hide
         * @deprecated Should be use PageMessage#close instead of PageMessage#hide.
         */
        hide: function() {
            console.warn('DEPRECATION WARNING: The "hide" event is going to be deprecated. From now on, please use "close" method instead.');
            this.emit('hide');
            this.close();
        },

        /**
         * Closes the element.
         * @emits PageMessage#close
         */
        close: function() {
            _handleFocusOnClose(this);
            this.classList.add('hidden');
            this.emit('close');
        },

        /**
         * This method must be removed, once the hide method is also removed.
         */
        addEventListener: function _() {
            HTMLElement.prototype.addEventListener.apply(this, arguments);
            if (arguments[0] === 'hide') {
                console.warn('DEPRECATION WARNING: The hide event is going to be deprecated. From now on, please use "close" instead.');
            }
        }
    });

    return register('ha-page-message', HAPageMessage);
});

define('hui/stacked-page-messages',[
    'register-component/v2/UIComponent',
    'register-component/v2/register',
    'object-utils/classes',
    './core/utils'
], function(UIComponent, register, classes, utils) {
    'use strict';

    var HAStackedPageMessages,
        ALERT_TYPE = 'alert', //for backward compatibility
        ERROR_TYPE = 'error',
        WARN_TYPE = 'warn';

    /**
     * Order the messages against its type.
     * @param {HAPageMessage} messageA
     * @param {HAPageMessage} messageB
     * @return {Number}
     */
    function _prioritize(messageA, messageB) {
        if (messageA.type !== messageB.type) {
            if (messageA.type === ALERT_TYPE || messageA.type === ERROR_TYPE) {
                return -1;
            } else if (messageB.type === ALERT_TYPE || messageB.type === ERROR_TYPE) {
                return 1;
            }

            if (messageA.type === WARN_TYPE) {
                return -1;
            } else if (messageB.type === WARN_TYPE) {
                return 1;
            }
        }
        return 0;
    }

    /**
     * Handles the focusing after closing the stacked-page-messages component
     * @param  {HTMLElement} component the stacked-page-messages component
     */
    function _handleFocusOnClose(component) {
        var parent = component.parentElement,
            previousSibling = component.previousElementSibling;

        if (previousSibling) {
            previousSibling.focus();
        } else if (parent) {
            previousSibling = parent.previousElementSibling;
            if (previousSibling) {
                previousSibling.focus();
            }
        }
    }

    function _findObsoleteMessages(oldMessages, newMessages) {
        return utils.getArrayDiff(oldMessages, newMessages);
    }

    function _findMessagesToAdd(oldMessages, newMessages) {
        return utils.getArrayDiff(newMessages, oldMessages);
    }

    HAStackedPageMessages = classes.createObject(UIComponent, {

        init: function _() {
            _.super(this);

            /**
             * Collection of messages to show.
             * @type {Array<HAPageMessage>}
             */
            this._messages = [];

            /**
             * Indicate if need sort the messages or not.
             */
            this._sortMessages = true;

            this.on('ha-page-message:close', function(event) {
                this.remove(this.messages.indexOf(event.target));
            }.bind(this));
        },

        /**
         * Adds a new message to the list.
         * @param {Object} message is the text of the message.
         * @param {Number} index of the message (optional)
         */
        add: function(message, index) {
            var newMessages = this.messages ? this.messages.slice() : [];
            if (message !== null) {
                if (index !== undefined) {
                    newMessages.splice(index, 0, message);
                    this._sortMessages = false;
                } else {
                    newMessages.push(message);
                }
            }
            this.messages = newMessages;
        },

        /**
         * Removes a message from the list.
         * @param {Number} index of the element to remove.
         */
        remove: function(index) {
            var messages;

            if (null !== this.messages && this.messages.length && index < this.messages.length) {
                messages = this.messages.slice();
                messages.splice(index, 1);
                this.messages = messages;
            }
        },

        /**
         * Add new messages into the component.
         * @param {Array} newMessages is the list of new page messages.
         */
        set messages(newMessages) {
            var toBeRemoved = _findObsoleteMessages(this._messages, newMessages),
                toBeAdded = _findMessagesToAdd(this._messages, newMessages);

            utils.removeNodesSafe(this, toBeRemoved);
            utils.appendChildCollection(this, toBeAdded);
            this._messages = newMessages;
            if (null !== newMessages && newMessages.length > 0) {
                //we will always sort the messages, except the last change on the set of messages
                //was an addition with an specific index. In that case, "_sortMessages" will be false
                //After doing that kind of addition, we set again the flag to true, to continue with
                //the normal behaviour
                if (this._sortMessages) {
                    newMessages.sort(_prioritize);
                }
                this._sortMessages = true;
                this.show();
            } else {
                this.close();
                _handleFocusOnClose(this);
            }
        },

        get messages() {
            return this._messages;
        },

        /**
         * Sort the messages.
         * Append the messages.
         * Select the last message.
         */
        postRender: function() {
            var oldMessages = utils.removeNodesSafe(this, this.querySelectorAll('ha-page-message'));

            this.innerHTML = '';
            this.messages = oldMessages;
        },

        /**
         * Hide the component.
         * @deprecated Should be use StackedPageMessages#close
         * @emits StackedPageMessages#hide for backward compatibility
         * @emits StackedPageMessages#close
         */
        hide: function() {
            this.close();
            console.warn('DEPRECATION WARNING: The "hide" method is going to be deprecated. From now please use "close" instead.');
            this.emit('hide');
        },

        /**
         * Close the component.
         * @emits StackedPageMessages#close
         */
        close: function() {
            this.classList.add('hidden');
            this.emit('close');
        },

        /**
         * Show the component.
         * @emits StackedPageMessages#show
         */
        show: function() {
            this.classList.remove('hidden');
            this.emit('show');
        },

        /**
         * This method must be removed, once the hide method is also removed.
         */
        addEventListener: function _() {
            HTMLElement.prototype.addEventListener.apply(this, arguments);
            if (arguments[0] === 'hide') {
                console.warn('DEPRECATION WARNING: The hide event is going to be deprecated. From now on, please use "close" instead.');
            }
        }
    });

    return register('ha-stacked-page-messages', HAStackedPageMessages);
});
define('hui/paginated-message',[
    'register-component/v2/register',
    'register-component/v2/UIComponent',
    'object-utils/classes'
], function(register, UIComponent, classes) {

    var HAPaginatedMessage;

    HAPaginatedMessage = classes.createObject(UIComponent, {

        init: function _() {
            _.super(this);

            /**
             * Content of the message
             */
            this._message = null;

            this.setupProperties({
                /**
                 * Title of the message.
                 * @type {String}
                 */
                titleText: {
                    default: '',
                    type: String,
                    change: function(newValue) {
                        this.querySelector('.message-title').textContent = newValue;
                        if (newValue) {
                            this.setAttribute('aria-label', newValue);
                        } else {
                            this.removeAttribute('aria-label');
                        }
                    }
                },

                /**
                 * Type of the message:
                 *  - info
                 *  - warn
                 *  - alert for backward compatibility
                 *  - error
                 * @type {String}
                 * @default: error
                 */
                type: {
                    default: 'error',
                    type: String,
                    change: function(newValue) {
                        if (newValue === 'alert') {
                            console.warn('DEPRECATION WARNING: The message type \'alert\' is deprecated. Please use \'error\' instead.');
                        }
                        if (newValue === 'alert' || newValue === 'error' || newValue === 'warn') {
                            this.querySelector('i').className = 'hi hi-circle-alert';
                        } else {
                            this.querySelector('i').className = 'hi hi-circle-info';
                        }
                    }
                }
            });
        },

        /**
         * Executed on show message.
         * @emits PaginatedMessage#show
         */
        show: function() {
            this.classList.remove('hidden');
            this.emit('show');
        },

        /**
         * Executed on hide message.
         * @emits PaginatedMessage#hide for backward compatibility
         * @emits PaginatedMessage#close
         * @deprecated should be use PaginatedMessage#close instead of PaginatedMessage#hide.
         */
        hide: function() {
            this.close();
            this.emit('hide');
            console.warn('DEPRECATION WARNING: The hide method is going to be deprecated. From now on, please use "close" instead.');
        },

        /**
         * Executed on close message.
         * @emits PaginatedMessage#close
         */
        close: function() {
            this.classList.add('hidden');
            this.emit('close');
        },

        set message(newValue) {
            if (typeof newValue === 'string') {
                this.querySelector('.message-content').innerHTML = newValue;
            } else {
                this.querySelector('.message-content').appendChild(newValue);
            }
            this._message = newValue;
        },

        get message() {
            return this._message;
        },

        /**
         * If it was rendered adds content, add/removes dismissible class, add corresponding type
         */
        postRender: function() {
            var contentEl = this.querySelector('.message-content'),
                titleEl = this.querySelector('.message-title'),
                iconEl = this.querySelector('i'),
                containerEl,
                messageContent;

            if (contentEl) {
                messageContent = contentEl.innerHTML;
            } else {
                messageContent = this.innerHTML;
            }

            if (!contentEl) {
                this.innerHTML = '';

                if (!iconEl) {
                    iconEl = this.ownerDocument.createElement('i');
                }
                iconEl.setAttribute('aria-hidden', true);

                containerEl = this.ownerDocument.createElement('div');
                containerEl.className = 'message-container';

                titleEl = this.ownerDocument.createElement('span');
                titleEl.className = 'message-title';
                titleEl.setAttribute('role', 'heading');
                titleEl.setAttribute('aria-level', '1');

                contentEl = this.ownerDocument.createElement('span');
                contentEl.className = 'message-content';

                containerEl.appendChild(titleEl);
                containerEl.appendChild(contentEl);

                this.appendChild(iconEl);
                this.appendChild(containerEl);

                this.setAttribute('role', 'alert');
            }

            this.message = messageContent;
            this.type = this.getAttribute('type') || 'error';
        },

        /**
         * This method must be removed, once the hide method is also removed.
         */
        addEventListener: function _() {
            HTMLElement.prototype.addEventListener.apply(this, arguments);
            if (arguments[0] === 'hide') {
                console.warn('DEPRECATION WARNING: The hide event is going to be deprecated. From now on, please use "close" instead.');
            }
        }
    });

    return register('ha-paginated-message', HAPaginatedMessage);
});

define('text!hui/paginated-messages/paginated-messages.html',[],function () { return '<template>\n    <div class="messages"></div>\n    <div class="pagination-control">\n        <button aria-label="Previous alert" class="navigate-previous"><i class="hi hi-chevron-left"></i></button>\n        <div class="pagination-control-text">\n        </div>\n        <button aria-label="Next alert" class="navigate-next"><i class="hi hi-chevron-right"></i></button>\n        <span class="arrow-border"></span>\n    </div>\n    <button aria-label="Close" class="btn hi hi-close"></button>\n</template>\n';});


define('hui/helpers/string.helper',[
], function() {
    var Helper = {
        replaceKeys: function(message, replaceData) {
            return message.replace(/{{([^{}]*)}}/g,
                function(a, b) {
                    var r = replaceData[b];
                    return typeof r === 'string' || typeof r === 'number' ? r : a;
                }
            );
        }
    };

    return Helper;
});

define('hui/paginated-messages',[
    'register-component/v2/register',
    'register-component/v2/UIComponent',
    'object-utils/classes',
    'register-component/template!./paginated-messages/paginated-messages.html',
    './core/keys',
    './helpers/string.helper',
    './core/utils',
    './core/a11y'
], function(register, UIComponent, classes, template, keys, stringHelper, utils, a11y) {

    /**
     * Updates visibility for next / previous message button and counters
     * @param {HAPaginatedMessages} component
     */
    function _updatePagination(component) {
        _paginationArrowsVisibility(component);
        _updateCounter(component);
    }

    /**
     * Updates visibility for next / previous message button
     * @param {HAPaginatedMessages} component
     */
    function _paginationArrowsVisibility(component) {
        var nextArrow = component.querySelector('.navigate-next'),
            previousArrow = component.querySelector('.navigate-previous'),
            focusOnNext = false,
            messagesCount = component._messages.length,
            doc = component.ownerDocument;

        if (component._displayedIndex === 1) {
            if (previousArrow === doc.activeElement) {
                focusOnNext = true;
            }
            previousArrow.classList.remove('visible');
        } else {
            previousArrow.classList.add('visible');
        }

        if (component._displayedIndex === messagesCount) {
            if (nextArrow === doc.activeElement) {
                previousArrow.focus();
            }
            nextArrow.classList.remove('visible');
        } else {
            nextArrow.classList.add('visible');

            if (focusOnNext) {
                nextArrow.focus();
            }
        }
    }

    /**
     * Updates counters for current message and total messages
     * @param {HTMLElement} component The component to be inspected
     */
    function _updateCounter(component) {
        var paginationContainer = component.querySelector('.pagination-control'),
            messagesCount = component._messages.length;

        if (messagesCount > 1) {
            paginationContainer.style.display = 'block';
        } else {
            paginationContainer.style.display = 'none';
        }

        paginationContainer.querySelector('.current-message').innerHTML = component._displayedIndex;
        paginationContainer.querySelector('.total-messages').innerHTML = messagesCount;
    }

    /**
     * Set the component on the specified message
     * @param {HTMLElement} component The component to be inspected
     * @param {Number} position The position of the message to be shown
     */

    function _goToMessage(component, position) {

        var messagesCount = component._messages.length,
            currentMessage;

        if (position > 0 && position <= messagesCount) {
            component._displayedIndex = position;
            currentMessage = component.querySelector('.paginated-message-displayed');
            if (currentMessage) {
                currentMessage.classList.remove('paginated-message-displayed');
            }

            component._messages[position - 1].classList.add('paginated-message-displayed');
            _updatePagination(component);
        }
    }

    var HAPaginatedMessages;

    HAPaginatedMessages = classes.createObject(UIComponent, {

        init: function _() {
            _.super(this);

            /**
             * Template of the element.
             * @type {String}
             */
            this.template = template;

            /**
             * Array of ha-paginated-message objects
             * @type {Array}
             * @private
             */
            this._messages = '';

            /**
             * Position of currently visible message
             * @type {Number}
             * @private
             */
            this._displayedIndex = 0;

            /**
             * Messages can be closed
             * @type {Boolean}
             */
            this._dismissible = true;

            this.setupProperties({
                /**
                 * Structure of the pagination messages
                 * @type {String}
                 */
                paginationLabel: {
                    default: '{{current}} of {{total}}',
                    type: String,
                    change: function(newValue) {
                        var template = stringHelper.replaceKeys(
                            newValue,
                            {
                                current: '<span class="current-message"></span>',
                                total: '<span class="total-messages"></span>'
                            }
                        );
                        this.querySelector('.pagination-control-text').innerHTML = template;
                        _updatePagination(this);
                    }
                }
            });

            this.on('.hi-close:click', function() {
                var messagesContainerEl = this.querySelector('.messages'),
                    messagesCount = this._messages.length,
                    currentMessage;
                if (this._dismissible && messagesCount > 0) {
                    currentMessage = messagesContainerEl.children[this._displayedIndex - 1];
                    currentMessage.close();
                    this._messages.splice(this._displayedIndex - 1, 1);
                    messagesContainerEl.removeChild(currentMessage);
                    messagesCount--;

                    this.emit('dismiss');

                    if (messagesCount === 0) {
                        this.close();
                    } else {
                        this._displayedIndex = Math.max(this._displayedIndex - 1, 1);
                        _goToMessage(this, this._displayedIndex);
                    }
                }

            }.bind(this));

            this.on('.navigate-next:click', function() {
                this.showNext();
            }.bind(this));
            this.on('.navigate-previous:click', function() {
                this.showPrevious();
            }.bind(this));
            this.on('keydown', function(evt) {
                if (evt.keyCode === keys.LEFT) {
                    this.showPrevious();
                } else if (evt.keyCode === keys.RIGHT) {
                    this.showNext();
                }
            }.bind(this), true);
        },

        /**
         * Return the display index that is a read only property.
         * @returns {Number}
         */
        get displayedIndex() {
            return this._displayedIndex;
        },

        get messages() {
            return this._messages;
        },

        get dismissible() {
            return this._dismissible;
        },

        set dismissible(newValue) {
            if (newValue) {
                this.classList.add('dismissible');
            } else {
                this.classList.remove('dismissible');
            }
            this._dismissible = newValue;
        },

        set messages(newValue) {
            this._messages = [];

            newValue = [].slice.call(newValue);

            var messagesContainerEl = this.querySelector('.messages'),
                firstMessage;

            messagesContainerEl.innerHTML = '';
            newValue.forEach(function(element) {
                messagesContainerEl.appendChild(element);
                this._messages.push(element);
            }.bind(this));

            firstMessage = messagesContainerEl.querySelector('ha-paginated-message:not(.hidden)');
            if (firstMessage) {
                firstMessage.classList.add('paginated-message-displayed');
            }

            _updatePagination(this);
        },

        /**
         * Shows next message
         * @emits PaginatedMessages#show-next
         */
        showNext: function() {
            _goToMessage(this, this._displayedIndex + 1);
            this.emit('show-next');
        },

        /**
         * Shows previous message
         * @emits PaginatedMessages#show-previous
         */
        showPrevious: function() {
            _goToMessage(this, this._displayedIndex - 1);
            this.emit('show-previous');
        },

        /**
         * Executed on show message.
         * @emits PaginatedMessages#show
         */
        show: function() {
            this.classList.remove('hidden');
            this.emit('show');
        },

        /**
         * Executed on hide message.
         * @deprecated Should be use PaginationMessages#close instead of PaginationMessages#hide.
         * @emits PaginatedMessages#hide for backward compatibility
         * @emits PaginatedMessages#close
         */
        hide: function() {
            this.close();
            this.emit('hide');
            console.warn('DEPRECATION WARNING: The hide method is going to be deprecated. From now on, please use "close" instead.');
        },

        /**
         * Executed on close message.
         * @emits PaginatedMessages#close
         */
        close: function() {
            a11y.setFocusOnPreviousElement(this);
            this.classList.add('hidden');
            this.emit('close');
        },

        /**
         * Transform list of messages from nodeArray to array
         */
        preRender: function() {
            var messages,
                messagesContainerEl = this.querySelector('.messages');

            // assign messages from ha-paginated-message nodes
            if (!this._messages) {
                messages = this.querySelectorAll('ha-paginated-message');
                if (messagesContainerEl) {
                    // but if we have rendered it already, don't attempt to remove the node
                    // make it an array
                    this._messages = Array.prototype.map.call(messages, function(element) {
                        return element;
                    });
                } else {
                    this._messages = utils.removeNodesSafe(this, messages);
                }
            }
        },

        /**
         * If it was rendered, empty the component and add the messages to it.
         */
        postRender: function() {
            var messagesContainerEl = this.querySelector('.messages'),
                firstMessage;

            this.setAttribute('tabindex', -1);

            messagesContainerEl.innerHTML = '';
            this._messages.forEach(function(element) {
                messagesContainerEl.appendChild(element);
            });

            if (this.getAttribute('dismissible') !== 'false') {
                this.dismissible = true;
            } else {
                this.dismissible = false;
            }

            this._displayedIndex = 1;

            firstMessage = messagesContainerEl.querySelector('ha-paginated-message:not(.hidden)');
            if (firstMessage) {
                firstMessage.classList.add('paginated-message-displayed');
            }
        },

        /**
         * This method must be removed, once the hide method is also removed.
         */
        addEventListener: function _() {
            HTMLElement.prototype.addEventListener.apply(this, arguments);
            if (arguments[0] === 'hide') {
                console.warn('DEPRECATION WARNING: The hide event is going to be deprecated. From now on, please use "close" instead.');
            }
        }
    });

    return register('ha-paginated-messages', HAPaginatedMessages);
});


define('text!hui/modal/modal.html',[],function () { return '<template>\n    <div class="modal" tabindex="-1" aria-labelledby="modal-title-{{componentId}}" aria-describedby="modal-text-{{componentId}}">\n        <div class="modal-dialog">\n            <div class="modal-content">\n                <header>\n                    <button type="button" class="btn btn-link hi hi-close medium pull-right" aria-label="Close"></button>\n                    <div class="modal-title">\n                    </div>\n                </header>\n                <section id="modal-text-{{componentId}}"></section>\n                <footer></footer>\n                <aside></aside>\n            </div>\n        </div>\n    </div>\n</template>';});


define('hui/modal',[
    'object-utils/classes',
    'register-component/v2/register',
    'register-component/v2/UIComponent',
    'register-component/template!./modal/modal.html',
    './core/a11y',
    './core/keys',
    './core/contentNode',
    './core/underlay',
    './core/utils'
], function(classes, register, UIComponent, template, a11y, keys, contentNode, underlay, utils) {

    function recreateModalTitle(component, size, type) {
        var titleContainer = component._nodes.title,
            modalTitle = titleContainer.querySelector('#modal-title-' + component.componentId);

        if (modalTitle) {
            titleContainer.removeChild(modalTitle);
        }

        if (size === 'small' && type === 'error' || size === 'small' && type === 'alert') {
            modalTitle = component.ownerDocument.createElement('h4');
        } else {
            modalTitle = component.ownerDocument.createElement('h2');
        }

        modalTitle.id = 'modal-title-' + component.componentId;
        modalTitle.textContent = component.titleText;

        titleContainer.appendChild(modalTitle);
    }

    /**
     * Map that says where to insert the content that the consumer sends on the initialization.
     * @type {Object}
     */
    var contentPropertyMap = {
        'main': 'message',
        'section': 'message',
        'aside': 'extraInfo',
        'footer': 'buttons'
    },

    /**
     * Used to track whether the animation has ended or not
     * @type {String}
     * @private
     */
    _animationend,

    /**
     * Indicates whether the component is visible after calling show
     * @type {Boolean}
     * @private
     */
    _visible = false,

    /**
     * Used for accesibility reasons to set the focus to the last active element
     * before the Modal is shown.
     * @type {HTMLElement}
     * @private
     */
    _lastFocus = null,

    HAModal = classes.createObject(UIComponent, {

        init: function _() {

            _.super(this);

            this.template = template;

            this._nodes = {};

            contentNode.cacheInputContent(this, contentPropertyMap);

            /**
             * Property to set the buttons of the Modal.
             * @type {Array}
             */
            this._buttons = null;

            /**
             * Property to set the text that provides additional details about the reason for the alert.
             * @type {HTMLElement}
             */
            this._message = '';

            /**
             * Property to set the extra sidebar content node for the endflow type.
             * @type {HTMLElement}
             */
            this._extrainfo = null;

            this.setupProperties({

                /**
                 * Property to set if the Modal shows the close button (true / false).
                 * @type {Boolean}
                 */
                dismissible: {
                    default: false,
                    type: Boolean,
                    change: function(newValue) {
                        var closeButton = this.querySelector('header button');

                        if (newValue) {
                            closeButton.classList.remove('hidden');
                            closeButton.classList.add('show');
                        } else {
                            closeButton.classList.add('hidden');
                            closeButton.classList.remove('show');
                        }
                    }
                },

                /**
                 * Property to set the size of the Modal ('small' / 'medium' / 'large').
                 * @type {String}
                 * @default {Small}
                 */
                size: {
                    default: 'small',
                    type: String,
                    change: function(newValue) {
                        var modal = this._nodes.modalDialog,
                            sizes = ['small', 'medium', 'large'],
                            i = 0;

                        for (; i < sizes.length; i++) {
                            if (modal.classList.contains(sizes[i])) {
                                modal.classList.remove(sizes[i]);
                            }
                        }

                        modal.classList.add(newValue);

                        recreateModalTitle(this, newValue, this.type);
                    }
                },

                /**
                 * Property to set the type of the Modal ('confirm' / 'info' / 'error' / 'warn' / 'endflow' / 'alert' (for backward compatibility)).
                 * @type {String}
                 */
                type: {
                    default: '',
                    type: String,
                    change: function(newValue) {
                        var modal = this._nodes.modalDialog,
                            titleContainer = this._nodes.title,
                            titleIcon = titleContainer.querySelector('i'),
                            types = ['confirm', 'info', 'error', 'warn', 'endflow', 'alert'],
                            i = 0;

                        if (newValue === '') {
                            return;
                        }

                        for (; i < types.length; i++) {
                            if (modal.classList.contains(types[i])) {
                                modal.classList.remove(types[i]);
                            }
                            if (titleContainer.classList.contains('hi-' + types[i])) {
                                titleContainer.classList.remove('hi-' + types[i]);
                            }
                        }

                        if ((newValue === 'error') || (newValue === 'alert') || (newValue === 'endflow')) {
                            modal.classList.add(newValue);

                            if (newValue === 'error' || newValue === 'alert') {
                                if (newValue === 'alert') {
                                    console.warn('DEPRECATION WARNING: Type "alert" is deprecated, take care using this type for futures releases');
                                }
                                this.setAttribute('role', 'alertdialog');
                                modal.classList.remove('message-icon');
                                titleContainer.classList.add('hi-' + newValue);
                            } else if (newValue === 'endflow') {
                                modal.classList.add('message-icon');
                                titleContainer.classList.add('hi-confirm');
                            }
                        } else {
                            modal.classList.add('message-icon');
                            titleContainer.classList.add('hi-' + newValue);
                        }
                        recreateModalTitle(this, this.size, newValue);
                        if (!titleIcon) {
                            titleIcon = this.ownerDocument.createElement('i');
                            if (titleContainer.firstElementChild) {
                                titleContainer.insertBefore(titleIcon, titleContainer.firstElementChild);
                            } else {
                                titleContainer.appendChild(titleIcon);
                            }
                        }
                        titleIcon.className = 'hi';
                        switch (newValue) {
                            case 'confirm':
                            case 'endflow':
                                titleIcon.classList.add('hi-circle-check');
                                break;
                            case 'info':
                                titleIcon.classList.add('hi-circle-info');
                                break;
                            case 'error':
                            case 'warn':
                            case 'alert':
                                titleIcon.classList.add('hi-circle-alert');
                                break;
                            default:
                                break;
                        }
                    }
                },

                /**
                 * Property to set the title of the Modal.
                 * @type {String}
                 */
                titleText: {
                    default: '',
                    type: String,
                    change: function(newValue) {
                        var modalTitle = this.querySelector('.modal-title h2') || this.querySelector('.modal-title h4');

                        if (modalTitle) {
                            modalTitle.textContent = newValue;
                        }
                    }
                }
            });

            this.tabIndex = '-1';
            this.setAttribute('role', 'dialog');

            _animationend = 'webkitAnimationName' in this.ownerDocument.documentElement.style ? 'webkitAnimationEnd' : 'animationend';

            /**
             * @emits dismiss.
             */
            this.on('header button:click', function() {
                this.emit('dismiss');
                this.close();
            }.bind(this));
        },

        set buttons(newValue) {
            var modalFooter = this.querySelector('footer'),
                footerBtnsClass,
                btnsLength,
                i = 0,
                value;

            while (modalFooter.firstChild) {
                modalFooter.removeChild(modalFooter.firstChild);
            }

            modalFooter.className = '';

            if (newValue) {
                if (Array.isArray(newValue)) {
                    for (; i < newValue.length; i++) {
                        value = newValue[i];
                        if (value && value.nodeType) {
                            modalFooter.appendChild(value);
                        }
                    }
                } else {
                    if (newValue.nodeType) {
                        modalFooter.appendChild(newValue);
                    }
                }

                btnsLength = modalFooter.children.length;

                if (btnsLength === 1) {
                    footerBtnsClass = 'one-btn';
                } else if (btnsLength === 2) {
                    footerBtnsClass = 'two-btn';
                } else if (btnsLength === 3) {
                    footerBtnsClass = 'three-btn';
                }
            }

            if (footerBtnsClass) {
                modalFooter.classList.add(footerBtnsClass);
            }

            this._buttons = newValue;
        },

        get buttons() {
            return this._buttons;
        },

        set message(newValue) {
            var body = this.querySelector('section'),
                i = 0,
                value;

            while (body.firstChild) {
                body.removeChild(body.firstChild);
            }

            if (newValue) {
                if (typeof newValue === 'string') {
                    body.textContent = newValue;
                } else if (Array.isArray(newValue)) {
                    for (; i < newValue.length; i++) {
                        value = newValue[i];
                        if (value && value.nodeType) {
                            body.appendChild(value);
                        }
                    }
                } else {
                    if (newValue.nodeType) {
                        body.appendChild(newValue);
                    }
                }
            }
            this._message = newValue;
        },

        get message() {
            return this._message;
        },

        set extraInfo(newValue) {
            var endflowContainer = this.querySelector('aside'),
                i = 0,
                value;

            while (endflowContainer.firstChild) {
                endflowContainer.removeChild(endflowContainer.firstChild);
            }

            if (newValue) {
                if (Array.isArray(newValue)) {
                    for (; i < newValue.length; i++) {
                        value = newValue[i];
                        if (value && value.nodeType) {
                            endflowContainer.appendChild(value);
                        }
                    }
                } else {
                    if (newValue.nodeType) {
                        endflowContainer.appendChild(newValue);
                    }
                }
            }
            this._extrainfo = newValue;
        },

        get extraInfo() {
            return this._extrainfo;
        },

        /**
         * Callback attached after the Component render
         * Creates a modal based on the attributes that were passed.
         */
        postRender: function _() {
            _.super(this);

            this._nodes.modal = this.querySelector('.modal');
            this._nodes.modalDialog = this.querySelector('.modal-dialog');
            this._nodes.title = this.querySelector('.modal-title');
            this._nodes.section = this.querySelector('section');

            contentNode.storeCachedInput(this, contentPropertyMap);
        },

        /**
         * This method must be removed, once the hide method is also removed.
         */
        addEventListener: function _() {
            HTMLElement.prototype.addEventListener.apply(this, arguments);
            if (arguments[0] === 'hide') {
                console.warn('DEPRECATION WARNING: The hide event is going to be deprecated. From now on, please use "close" instead.');
            }
        },

        /**
         * Opens the Modal, and makes the elements inside to be accesible from the keyboard.
         * @emits show.
         */
        show: function() {
            if (!_visible) {
                _visible = true;

                var modal = this._nodes.modal,
                    body = this._nodes.section,
                    firstFocusable = modal.querySelector('.ha-button-primary') || body.querySelector('input, button, textarea, select'),
                    self = this;

                this.ownerDocument.body.classList.add('modal-open');
                this.classList.remove('hidden');
                this.classList.add('show');
                underlay.show(this);

                _lastFocus = this.ownerDocument.activeElement;

                if (firstFocusable) {
                    firstFocusable.focus();
                } else {
                    modal.focus();
                }

                /**
                 * @emits dismiss
                 */
                this.on('keydown', function(evt) {
                    if (evt.keyCode === keys.ESCAPE) {
                        utils.stopEvent(evt);
                        this.emit('dismiss');
                        self.close();
                    }

                    a11y.keepFocusInsideListener(evt, modal);
                });

                this.emit('show');
            }
        },

        /**
         * Closes the Modal, and remove the elements inside from the keyboard access.
         * @emits close.
         */
        close: function() {
            if (_visible) {
                _visible = false;

                var modal = this._nodes.modal,
                    self = this;

                this.classList.add('hidden');

                this.off('keydown');

                underlay.hide();

                this.listenTo(modal, _animationend, function onClose() {
                    self.stopListening(modal, _animationend, onClose);

                    self.classList.remove('show');
                    self.ownerDocument.body.classList.remove('modal-open');
                    self.emit('close');
                    self.emit('hide');

                    if (_lastFocus) {
                        _lastFocus.focus();
                    }
                    _lastFocus = null;
                });
            }
        },

        /**
         * Calls the close method.
         * @deprecated
         */
        hide: function() {
            console.warn('DEPRECATION WARNING: This method is deprecated, take care using this method for futures releases');
            this.close();
        },

        /**
         * Adds content to the component
         * @param       {object} config Mapping between HTML and properties
         * @deprecated                  Properties should be used directly instead
         */
        addContent: function(config) {
            contentNode.addContent(this, config, contentPropertyMap);
        }
    });

    return register('ha-modal', HAModal);
});

define('hui/menu',[
    'object-utils/classes',
    'register-component/v2/register',
    'register-component/v2/UIComponent',
    './core/keys',
    './core/utils'
],
function(classes, register, UIComponent, keys, utils) {

    /**
     * Searches trought the menu-items for a label with the current search term and set focus on the result (if any)
     * @param  {HTMLElement} component ha-menu where the search is made
     * @private
     */
    function _search(component) {
        var searchTerm = component._searchTerm.toLowerCase(),
            searchTermLength = searchTerm.length,
            activeElement = component.ownerDocument.activeElement,
            currentPos = -1,
            position = 0;

        if (activeElement) {
            currentPos = component.items.indexOf(activeElement);
        }

        if ((currentPos !== -1) && (currentPos !== component.items.length - 1)) {
            position = currentPos + 1;
        }

        while (position !== currentPos)  {
            if (component.items[position].label.toLowerCase().substr(0, searchTermLength) === searchTerm &&
                !component.items[position].disabled) {
                component.items[position].focus();
                currentPos = position;
            } else {
                if (position === component.items.length - 1) {
                    position = 0;
                } else {
                    ++position;
                }
            }
        }

        // Reset to original state
        component._timeOut = null;
        component._searchTerm = null;
    }

    /**
     * Adds/removes current selected item to the selected elements
     * @param  {HTMLElement} component ha-menu to update selected property
     * @param  {HTMLElement} menuItem  ha-menu-item to add/remove to the selected list
     * @emits   HAMenu#select
     * @private
     */
    function _selectItem(component, menuItem) {
        [].forEach.call(component.items, function(item) {
            item.selected = false;
            item.setAttribute('aria-selected', false);
        });

        component._selectedItem = menuItem;

        if (component.selectedIndex !== component.items.indexOf(menuItem)) {
            component.selectedIndex = component.items.indexOf(menuItem);
        }

        menuItem.selected = true;
        menuItem.setAttribute('aria-selected', true);
    }

    /**
     * Determinates if the menuItem is a selectable type and is not disabled
     * @param  {HTMLElement}  menuItem ha-menu-item to be selected
     * @return {Boolean}          If the menuItem can be selected
     * @private
     */
    function _isSelectableItem(menuItem) {
        return menuItem.type !== 'separator' && !menuItem.disabled;
    }

    /**
     * Search for next focusable element in the given order and set focus on it
     * @param  {Array} items       List of menu items
     * @param  {String} direction   Direction to search for next menu item. Can be 'up' or 'down'
     * @param  {Number} position    Position where to start search
     * @param  {Number} endPosition Optional. Position where to stop searching
     * @private
     */
    function _focusOnNextSelectable(items, direction, position, endPosition) {
        var length = items.length;

        while (position > -1 && position < length) {
            if (position === endPosition) {
                return;
            }
            if (_isSelectableItem(items[position])) {
                items[position].focus();
                return;
            }
            if (direction === 'down') {
                position++;
            } else {
                position--;
            }
        }
    }

    var HAMenu,

        // Constant height of ha-menu-items
        MENU_ITEM_HEIGHT = 34;

    HAMenu = classes.createObject(UIComponent, {

        init: function _() {

            _.super(this);

            /**
             * Selected HAMenuItem.
             * @type {HTMLElement}
             */
            this._selectedItem = null;

            /**
             * List of HAMenuItems included in the menu
             * @type {Array}
             */
            this._items = null;

            this.setupProperties({

                /**
                 * Position of the HAMenuItems currently selected
                 * @type {Number}
                 */
                selectedIndex: {
                    default: -1,
                    type: Number,
                    change: function(newValue) {
                        if (newValue === -1) {
                            this._selectedItem = null;
                        } else if ((newValue >= 0) && (newValue < this.length)) {
                            var menuItem = this._items[newValue];
                            if (this.selectedItem !== menuItem) {
                                _selectItem(this, menuItem);
                                this.emit('select');
                            }
                        } else {
                            this._selectedIndex = -1;
                        }
                    }
                },

                /**
                 * Amount of items to be visible at once. If smaller than length, a scrollbar is shown.
                 * If size property is bigger than 0, adjusts the height of the ha-menu.
                 * @type {Number}
                 */
                size: {
                    default: 0,
                    type: Number,
                    change: function(newValue) {
                        if (newValue) {
                            this.style.maxHeight = (newValue * MENU_ITEM_HEIGHT) + 'px' ;
                            this.style.overflowY = 'auto';
                        } else {
                            this.style.maxHeight = 'none';
                            this.style.overflowY = 'hidden';
                        }
                    }
                }
            });

            this.tabIndex = -1;
            if (!this.hasAttribute('role')) {
                this.setAttribute('role', 'menu');
            }

            this.on('ha-menu-item:click', function(ev) {
                if (ev.target.tagName !== 'HA-MENU-ITEM') {
                    return;
                }
                var menuItem = ev.target;
                if (_isSelectableItem(menuItem)) {
                    _selectItem(this, menuItem);
                    this.emit('select', {detail: {selectedByClickOrKeyboard: true}});
                }
            }.bind(this));

            this.on('keydown', function(evt) {
                var menuItem = evt.target,
                    items = this.items,
                    position;

                // If a letter or number is entered, we start the search process
                if (keys.isLetter(evt.keyCode) || keys.isNumber(evt.keyCode)) {
                    utils.stopEvent(evt);
                    if (this._timeOut) {
                        clearTimeout(this._timeOut);
                    } else {
                        this._searchTerm = '';
                    }
                    this._searchTerm += String.fromCharCode(evt.keyCode);
                    this._timeOut = setTimeout(function() {
                        _search(this);
                    }.bind(this), 1000);
                    return;
                }

                // If the menu was open by click, thus focus in not on the items
                if (menuItem.tagName !== 'HA-MENU-ITEM' && (evt.keyCode === keys.UP || evt.keyCode === keys.DOWN ||
                    evt.keyCode === keys.END || evt.keyCode === keys.HOME)) {
                    utils.stopEvent(evt);
                    items[0].focus();
                    return;
                }

                switch (evt.keyCode){
                    case keys.UP:
                        utils.stopEvent(evt);
                        position = (items.indexOf(menuItem) === 0 ? items.length - 1 : items.indexOf(menuItem) - 1);
                        _focusOnNextSelectable(items, 'up', position);
                        break;
                    case keys.DOWN:
                        utils.stopEvent(evt);
                        _focusOnNextSelectable(items, 'down', (items.indexOf(menuItem) + 1) % items.length);
                        break;
                    case keys.END:
                        utils.stopEvent(evt);
                        _focusOnNextSelectable(items, 'up', items.length - 1, items.indexOf(menuItem));
                        break;
                    case keys.HOME:
                        utils.stopEvent(evt);
                        _focusOnNextSelectable(items, 'down', 0, items.indexOf(menuItem));
                        break;
                    case keys.ENTER:
                    case keys.SPACEBAR:
                        if (menuItem.tagName === 'HA-MENU-ITEM' && _isSelectableItem(menuItem)) {
                            utils.stopEvent(evt);
                            _selectItem(this, menuItem);
                            this.emit('select', {detail: {selectedByClickOrKeyboard: true}});
                        }
                        break;
                    default:
                        return;
                }
            }.bind(this), true);

            this.on('ha-menu-item:mousemove', function(evt) {
                evt.target.focus();
            }.bind(this), true);
        },

        /**
         * If items array contains literal objects instead of ha-menu-item, it creates them.
         */
        set items(newValue) {
            var nodeItem;

            this.tabIndex = -1;
            while (this.firstChild) {
                this.removeChild(this.firstChild);
            }

            if (newValue) {
                newValue.forEach(function(item) {
                    if (!item.nodeName) {
                        nodeItem = this.ownerDocument.createElement('ha-menu-item');
                        for (var property in item) {
                            nodeItem[property] = property;
                        }
                    } else {
                        nodeItem = item;
                    }
                    nodeItem.setAttribute('aria-selected', !!nodeItem.selected);
                    this.appendChild(nodeItem);
                }.bind(this));
                this.length = newValue.length;
            }

            this._items = newValue;
        },

        get items() {
            return this._items;
        },

        get selected() {
            console.warn('DEPRECATION WARNING: selected property is deprecated. Use selectedItem instead');
            return this._selectedItem;
        },

        get selectedItem() {
            return this._selectedItem;
        },

        /**
        * Dummy method to avoid problems with getter without setters
        */
        set selected(newValue) {
            // jshint unused:false
        },

        /**
         * Number of HAMenuItems included in the menu
         */
        get length() {
            return this._items.length;
        },

        /**
        * Dummy method to avoid problems with getter without setters
        */
        set length(newValue) {
            // jshint unused:false
        },

        /**
         * Sets the list of ha-menu-item
         */
        preRender: function() {
            var items = this.querySelectorAll('ha-menu-item');

            this.items = utils.removeNodesSafe(this, items);
        },

        /**
         * Adds a Menu Item to the ha-menu
         * @param {HTMLElement} menuItem ha-menu-Item to add to the ha-menu
         * @param {Number} position (Optional) Sets in which position to add the ha-menu-Item
         */
        add: function(menuItem, position) {
            position = (typeof position !== 'undefined') ? position : this.items.length;
            this.items.splice(position, 0, menuItem);
            // To call setter
            this.items = this.items;
        },

        /**
         * Removes a Menu Item from the ha-menu
         * @param  {Number} position Position of the ha-menu-Item to me removed from the ha-menu
         */
        remove: function(position) {
            if (position >= 0 && position < this.items.length) {
                this.items.splice(position, 1);
                // To call setter
                this.items = this.items;
            }
        }

    });

    return register('ha-menu', HAMenu);
});

define('hui/menu-item',[
    'register-component/v2/register',
    'register-component/v2/UIComponent',
    'object-utils/classes'
],
function(register, UIComponent, classes) {

    /**
     * Retrieve only the text content of given value, and in case that have HTML tags will be remove it.
     * @param {String} dirtyValue   The value that will be cleaned
     * @private
     */
    function _getTextContent(dirtyValue) {
        if (dirtyValue) {
            return dirtyValue.replace(/<\/?[^>]+(>|$)/g, '');
        }
    }

    var HAMenuItem = classes.createObject(UIComponent, {

        init: function _() {

            _.super(this);

            this.setupProperties({
                /**
                 * This is the text for the button
                 * @type {String}
                 */
                label: {
                    default: '',
                    change: function(newValue) {
                        if (this.type === 'default') {
                            this.innerHTML = newValue;
                            this.setAttribute('aria-label', _getTextContent(newValue));
                        }

                    }
                },

                /**
                 * This is the value for the menu-item
                 * @type {String}
                 */
                value: {
                    default: ''
                },

                /**
                 * Disabled indicates if the menu button is disabled.
                 * @type {Boolean}
                 */
                disabled: {
                    default: false,
                    type: Boolean,
                    change: function(newValue) {
                        if (newValue) {
                            this.classList.add('disabled');
                        } else {
                            this.classList.remove('disabled');
                        }
                    }
                },

                /**
                 * Defines whether the component is selected by default.
                 * @type {Boolean}
                 */
                selected: {
                    default: false,
                    type: Boolean
                },

                /**
                 * Type of the component. Possible values are: 'default', 'separator', 'checked'
                 * @type {String}
                 */
                type: {
                    default: 'default',
                    change: function(newValue) {
                        if (newValue === 'separator') {
                            this.classList.add('separator');
                            this.innerHTML = '';
                        } else {
                            this.classList.remove('separator');
                            this.innerHTML = this.label;
                        }
                    }
                }
            });

        },

        postRender: function _() {
            _.super(this);

            this.tabIndex = -1;
            this.label = this.innerHTML;
            this.value = this.getAttribute('value') || this.label;
            this.setAttribute('role', 'button');
        }
    });

    return register('ha-menu-item', HAMenuItem);
});

define('hui/item',[
    'register-component/v2/UIComponent',
    'register-component/v2/register',
    'object-utils/classes'
],
function(UIComponent, register, classes) {
    'use strict';

    var HASItem;

    HASItem = classes.createObject(UIComponent, {

        init: function _() {

            _.super(this);

            this.setupProperties({
                /**
                * Value of the component.
                * @type {String}
                */
                value: {
                    default: '',
                    type: String
                },

                /**
                 * Label of the component.
                 * @type {String}
                 */
                label: {
                    default: '',
                    type: String,
                    change: function(newValue) {
                        this.innerHTML = newValue;
                    }
                }
            });

        },

        postRender: function _() {
            _.super(this);

            this.label = this.innerHTML;

            this.value = this.getAttribute('value') || this.label;
        }
    });

    return register('ha-item', HASItem);
});
define('hui/menu/menu-based-buttons',[
    'object-utils/classes',
    'register-component/v2/UIComponent',
    '../core/popup',
    '../core/utils',
    '../core/keys',
    '../popover',
    '../menu',
    '../menu-item',
    '../item'
],
function(classes, UIComponent, popup, utils, keys) {
    'use strict';

    /**
     * Helper to show the popover based on positionTarget
     * @param {HTMLElement} popover The popover with menu items to show.
     * @param {HTMLElement} positionTarget The element that should be used to position the popover when it is opened.
     * @private
     */
    function _showPopover(popover, positionTarget) {
        if (popover) {
            if (popover.open) {
                popup.setPosition(popover, positionTarget, ['bottom', 'top'], ['left', 'right']);
            } else {
                popup.show(popover, positionTarget, ['bottom', 'top'], ['left', 'right']);
            }
        }
    }

    /**
     * Helper to hide the popover
     * @param {ha-popover} popover the popover to hide
     * @private
     */
    function _hidePopover(popover) {
        popup.hide(popover);
    }

    function _showPopoverMenu(popover, positionTarget, triggerElement) {
        triggerElement.setAttribute('aria-expanded', 'true');
        triggerElement.classList.add('active');

        // logically if you think about it, the setting of properties in popoverMenu should be in postRender
        // but due to cloneNode issues, it sets first to true, then the popover.postRender gets called which sets it again to false
        // setting it here guarantees it is always true

        // do not focus on popoverMenu child element on show
        popover._noAutoFocusFirstTabbableElementOnShow = true;
        // when have a popoverMenu open and we click outside it should not focus back to the component
        popover._noAutoFocusLastActiveElementOnClose = true;

        // the positionTarget is the triggerElement in this case
        _showPopover(popover, positionTarget);
    }

    function _hidePopoverMenu(popover, triggerElement) {
        if (!popover.open) {
            return;
        }

        triggerElement.setAttribute('aria-expanded', 'false');
        triggerElement.classList.remove('active');
        _hidePopover(popover);
    }

    var menuBasedButtons = classes.createObject(UIComponent, {

        init: function _() {
            _.super(this);

            /**
             * Element that is contained inside the ha-popover
             * @type {HTMLElement}
             * @deprecated
             */
            this._popover = null;

            /**
             * List of HAMenuItems
             * @type {Array}
             */
            this._items = null;

            this.setupProperties({

                /**
                 * This is the text for the button.
                 * @type {String}
                 */
                label: {
                    default: '',
                    type: String,
                    change: function(newValue) {
                        var label = this.querySelector('.label'),
                            menu = this.querySelector('ha-menu');

                        label.innerHTML = newValue;
                        menu.setAttribute('aria-labelledby', newValue);
                    }
                },

                /**
                 * Selected item index.
                 * @type {Number}
                 */
                selectedIndex: {
                    default: -1,
                    type: Number,
                    change: function(newValue) {
                        var menu = this.querySelector('ha-menu');

                        if (Array.isArray(this.items) && newValue > -1 && newValue < this.items.length) {
                            menu.selectedIndex = this.selectedIndex;
                        } else if (newValue !== -1) {
                            this.selectedIndex = -1;
                        }
                    }
                }
            });
        },

        /**
         * Creates the necessary HTML elements
         */
        postRender: function _() {
            _.super(this);

            var popoverMenu = this.querySelector('ha-popover'),
                triggerElement = this._getTriggerElement(),
                menu;

            if (!popoverMenu) {
                // create popoverMenu
                popoverMenu = this.ownerDocument.createElement('ha-popover');
                popoverMenu.classList.add('popover-menu-items');
                popoverMenu.targetSelector = '#' + this._getTargetSelectorId();

                // create menu and assign to popoverMenu section
                popoverMenu.section = this.ownerDocument.createElement('ha-menu');
                this.appendChild(popoverMenu);
            }

            // menu popoverMenu is available here
            menu = popoverMenu.querySelector('ha-menu');

            // if button portion is already existing, don't render again
            if (!triggerElement) {
                triggerElement = this._renderTriggerElement();
            }

            this.items = Array.prototype.slice.apply(this.querySelectorAll('ha-item'));

            this.listenTo(triggerElement, 'click', function(evt) {
                if (this.disabled) {
                    return;
                }

                // should not emit click events
                evt.stopPropagation();

                // FF and Safari looses focus on the triggerElement when clicked
                // use workaround below to focus again
                triggerElement.focus();

                if (popoverMenu.open) {
                    _hidePopoverMenu(popoverMenu, triggerElement);
                } else {
                    _showPopoverMenu(popoverMenu, this, triggerElement);
                }
            }.bind(this));

            this.listenTo(triggerElement, 'blur', function(evt) {
                var safeTarget = utils.getSafeTargetFromEvent(evt);

                if (!this.contains(safeTarget)) {
                    _hidePopoverMenu(popoverMenu, triggerElement);
                    this.emit('blur');
                }
            }.bind(this), true);

            this.listenTo(triggerElement, 'keydown', function(evt) {
                if (this.disabled) {
                    return;
                }

                var newFocus;

                switch (evt.keyCode) {
                    case keys.SPACEBAR:
                    case keys.ENTER:
                        utils.stopEvent(evt);
                        if (!popoverMenu.open) {
                            _showPopoverMenu(popoverMenu, this, triggerElement);
                        }
                        break;
                    case keys.DOWN:
                        utils.stopEvent(evt);
                        if (popoverMenu.open) {
                            // if popover is already open and position is bottom
                            if (popoverMenu.classList.contains('position-bottom')) {
                                newFocus = (menu.items && menu.items.length > 0) ? menu.items[0] : menu;
                                newFocus.focus();
                            }
                        } else {
                            // open popover if not yet opened
                            _showPopoverMenu(popoverMenu, this, triggerElement);
                        }
                        break;
                    case keys.UP:
                        utils.stopEvent(evt);
                        if (popoverMenu.open) {
                            // if popover position is top
                            if (popoverMenu.classList.contains('position-top')) {
                                newFocus = (menu.items && menu.items.length > 0) ? menu.items[menu.items.length - 1] : menu;
                                newFocus.focus();
                            }
                        } else {
                            // open popover if not yet opened
                            _showPopoverMenu(popoverMenu, this, triggerElement);
                        }
                        break;
                }
            }.bind(this), true);

            this.listenTo(popoverMenu, 'show', function(evt) {
                evt.stopPropagation();
                this.emit('items-show');
            }.bind(this));

            this.listenTo(popoverMenu, 'close', function(evt) {
                evt.stopPropagation();
                this.emit('items-close');
            }.bind(this));

            // backward-compatibility popover hide event, stop bubbling
            this.listenTo(popoverMenu, 'hide', function(evt) {
                evt.stopPropagation();
            });

            // on an opened popover when user passes his mouse over the popover and clicks
            // on another component, this makes sure to hide the popover
            this.listenTo(popoverMenu, 'blur', function(evt) {
                var safeTarget = utils.getSafeTargetFromEvent(evt);
                if (!this.contains(safeTarget)) {
                    _hidePopoverMenu(popoverMenu, triggerElement);
                    this.emit('blur');
                }
            }.bind(this), true);

            // menu items should not emit click events
            this.listenTo(menu, 'click', function(evt) {
                if (evt.target.localName === 'ha-menu-item') {
                    evt.stopPropagation();
                }
            }.bind(this));

            this.listenTo(menu, 'select', function(evt) {
                evt.stopPropagation();
                // set the selectedIndex from the menu
                this.selectedIndex = evt.target.selectedIndex;
                _hidePopoverMenu(popoverMenu, triggerElement);
                // re-emit select events from ha-menu to host component
                this.emit('select');
            }.bind(this));

            this.on('keydown', function(evt) {
                if (this.disabled) {
                    return;
                }

                if (evt.keyCode === keys.TAB || evt.keyCode === keys.ESCAPE) {
                    if (popoverMenu.open) {
                        utils.stopEvent(evt);
                        _hidePopoverMenu(popoverMenu, triggerElement);
                        // focuses back to the triggerElement so that pressing SPACE opens the popoverMenu again
                        triggerElement.focus();
                    }
                }
            }.bind(this));

            // Fix for FF triggering click when pressing spacebar
            this.listenTo(triggerElement, 'keyup', function(evt) {
                /* istanbul ignore if */
                if (evt.keyCode === keys.SPACEBAR) {
                    evt.preventDefault();
                }
            }, true);
        },

        set popover(newPopover) {
            console.warn('DEPRECATION WARNING: "popover" property is going to be deprecated, please from now on don\'t use it.');

            var triggerElement, targetSelectorId;

            /* istanbul ignore if */
            if (this.popover && this.popover !== newPopover) {
                this.removeChild(this.popover);
            }

            this._popover = newPopover;

            if (newPopover) {
                targetSelectorId = this._getTargetSelectorId();
                newPopover.classList.add('popover-menu-items');
                newPopover.targetSelector = '#' + targetSelectorId;
                // when have a popover open and we click outside it should not focus back to the component
                newPopover._noAutoFocusLastActiveElementOnClose = true;

                triggerElement = this._getTriggerElement();
                if (triggerElement) {
                    triggerElement.id = targetSelectorId;
                }

                if (newPopover.parentNode !== this) {
                    this.appendChild(newPopover);
                }
            }
        },

        get popover() {
            console.warn('DEPRECATION WARNING: "popover" property is going to be deprecated, please from now on don\'t use it.');
            return this._popover;
        },

        set items(newValue) {
            if (newValue) {
                var menu = this.querySelector('ha-menu'),
                    items,
                    newItems = [],
                    menuItem;

                // Remove all ha-items.
                // Should enter here only if we are replacing items with javascript
                items = Array.prototype.slice.call(this.querySelectorAll('ha-item'));
                items.forEach(function(item) {
                    this.removeChild(item);
                }.bind(this));

                if (Array.isArray(newValue)) {
                    newValue.forEach(function(item) {
                        menuItem = this.ownerDocument.createElement('ha-menu-item');
                        menuItem.setAttribute('role', 'menuitem');
                        menuItem.label = item.textContent;
                        menuItem.value = item.value || item.getAttribute('value');
                        if ((item.hasAttribute('disabled') && item.getAttribute('disabled') !== false) || item.disabled) {
                            menuItem.disabled = true;
                        }
                        newItems.push(menuItem);

                        this.insertBefore(item, this.querySelector('.popover-menu-items'));
                    }.bind(this));
                } else if (newValue.nodeType) {
                    menuItem = this.ownerDocument.createElement('ha-menu-item');
                    menuItem.setAttribute('role', 'menuitem');
                    menuItem.label = newValue.textContent;
                    menuItem.value = newValue.textContent;
                    if ((newValue.hasAttribute('disabled') && newValue.getAttribute('disabled') !== false) || newValue.disabled) {
                        menuItem.disabled = true;
                    }
                    newItems.push(menuItem);

                    this.insertBefore(newValue, this.querySelector('.popover-menu-items'));
                }
                if (menu.render) {
                    menu.items = newItems;
                } else {
                    menu.innerHTML = '';
                    newItems.forEach(function(item) {
                        menu.appendChild(item);
                    });
                }
                this._items = newValue;
            }
        },

        /**
         * Gets the items
         */
        get items() {
            return this._items;
        },

        /**
        * Dummy method to avoid problems with getter without setters
        */
        set selectedItem(newValue) {
            // jshint unused:false
        },

        /**
         * Gets the selected item from the menu
         */
        get selectedItem() {
            return Array.isArray(this.items) && this.selectedIndex > -1 ? this.items[this.selectedIndex] : null;
        },

        /**
         * The id used for the local button id which also matches the targetSelector of the popover
         * @private
         * return {String} id
         */
        _getTargetSelectorId: function() {
            return this.localName + '-target-' + this.componentId;
        }
    });

    return menuBasedButtons;
});

define('hui/menu-button',[
    'object-utils/classes',
    'register-component/v2/register',
    './menu/menu-based-buttons'
],
function(classes, register, MenuBasedButtons) {
    'use strict';

    var buttonClasses = ['ha-button-default', 'ha-button-primary', 'ha-button-dark'],
        HAMenuButton;

    HAMenuButton = classes.createObject(MenuBasedButtons, {
        init: function _() {
            _.super(this);

            this.setupProperties({
                /**
                 * Disabled indicates if the menu button is disabled.
                 * @type {Boolean}
                 */
                disabled: {
                    default: false,
                    type: Boolean,
                    change: function(newValue) {
                        var button = this.querySelector('button');

                        if (newValue) {
                            button.disabled = true;
                        } else {
                            button.disabled = false;
                        }
                    }
                }
            });
        },

        _renderTriggerElement: function() {
            var triggerElement, label, buttonCaret;

            // create trigger button
            triggerElement = this.ownerDocument.createElement('button');
            triggerElement.type = 'type';
            triggerElement.className = 'ha-button no-connector';
            triggerElement.id = this._getTargetSelectorId();
            triggerElement.setAttribute('aria-expanded', 'false');
            triggerElement.setAttribute('aria-haspopup', 'true');

            label = this.ownerDocument.createElement('span');
            label.className = 'label';
            triggerElement.appendChild(label);

            buttonCaret = this.ownerDocument.createElement('span');
            buttonCaret.className = 'caret';
            triggerElement.appendChild(buttonCaret);

            this.appendChild(triggerElement);

            return triggerElement;
        },

        _getTriggerElement: function() {
            return this.querySelector('button.ha-button.no-connector');
        },

        attachedCallback: function _() {
            _.super(this);

            var button = this._getTriggerElement();

            buttonClasses.forEach(function(currentClass) {
                if (this.classList.contains(currentClass)) {
                    button.classList.add(currentClass);
                }
            }, this);
        }
    });

    return register('ha-menu-button', HAMenuButton);
});

define('hui/add-new-helper',[
    './core/popup'
], function(popup) {

    /**
     * Hide given popover with the popup helper.
     * @param {HA-POPOVER|HA-POPOVER-FORM} popover
     * @private
     */
    function _hidePopover(popover) {
        if (popover && popover.open) {
            popup.hide(popover);
        }
    }

    /**
     * Show given popover with the popup helper.
     * @param {HTMLElement} select
     * @param {HTMLElement} popover
     * @private
     */
    function _showPopover(select, popover) {
        var content;

        if (popover) {
            if (select.tagName === 'HA-SELECT') {
                content = select;
            } else {
                content = select.querySelector('.search-container');
            }
            if (!popover.open) {
                popup.show(popover, content, ['bottom', 'top'], ['left', 'right']);
            }
        }
    }

    /**
     * Creates a new menu item.
     * @param  {HTMLElement}    select  Where to insert the new menu item
     * @param  {String}         label   Text for the item
     * @param  {String}         value   Value for the item
     * @return {HTMLElement}            Created ha-menu-item
     */
    function _createMenuItem(select, label, value) {
        var menuItem = select.ownerDocument.createElement('ha-menu-item');
        menuItem.label = label;
        menuItem.value = value || label;
        menuItem.setAttribute('role', 'option');
        return menuItem;
    }

    /**
     * Creates new ha-menu-item and adds it to ha-menu
     * @param {HA-MENU} menu           Where to insert the new menu item
     * @param {String}  addNewText     The text of add new value
     * @param {String}  addNewValue    The value of add new value
     * @param {Object}  select         The main context component
     * @private
     */
    function _addNewMenuItem(menu, addNewText, addNewValue, select) {
        var menuItem,
            items;

        if (menu && menu.tagName === 'HA-MENU') {
            items = menu.items;
            menu.setAttribute('role', 'listbox');

            if (!items || items.length === 0 || !items[0].classList.contains('add-new-menu-item')) {
                menuItem = _createMenuItem(menu, '<span class="hi hi-create-lg"></span> ' + addNewText + ' ' + addNewValue, '', select.addNewText);
                menuItem.classList.add('add-new-menu-item');
                menu.add(menuItem, 0);
            }
        }
    }

    var Helper = {

        /**
         * Show the popover form of the component.
         * @param {HTMLElement} select  Component that contains the menu items popover
         * @param {HTMLElement} popover A popover component
         */
        showPopoverForm: function(select, popover) {
            var popoverMenu = select.querySelector('ha-popover.popover-menu-items'),
                input,
                addNewNameSelector;

            _hidePopover(popoverMenu);
            if (select.tagName !== 'HA-SELECT') {
                addNewNameSelector = popover.querySelector('ha-popover-form').addNewNameSelector;
                if (addNewNameSelector) {
                    input = popover.querySelector(addNewNameSelector);
                    input.value = select.typedText;
                }
            }
            _showPopover(select, popover);
        },

        /**
         * Add the Add new menu item of given component.
         * @param {HTMLElement} select   Component that contains the menu items popover
         */
        addMenuItem: function(select) {
            var popover = select.querySelector('ha-popover.popover-menu-items'),
                addNewValue = '',
                menu = popover.querySelector('ha-menu');

            if (select.tagName !== 'HA-SELECT') {
                addNewValue = select.querySelector('input').value;
            }
            _addNewMenuItem(menu, select.addNewText, addNewValue, select);
        }
    };

    return Helper;
});

define('hui/typeahead-base',[
        './validatable/validatable',
        'object-utils/classes',
        './core/popup',
        './add-new-helper',
        './core/keys',
        './core/utils',
        './popover',
        './popover-form',
        './menu',
        './menu-item',
        './text-field'
    ],
    function(validatable, classes, popup, AddNewHelper, keys, utils) {
        'use strict';
        var HATypeAheadBase,
            STORE_MAX_RESULT = 7,
            // we use a closure var to save the current opened popover menu so that it can be closed if
            // a user clicks another select or text field type ahead. Blur alone didn't work for FF/Safari
            currentOpenedPopoverMenu = null;

        /**
         * Runs the necessary validations over the component
         * @param  {Event} evt  The event that triggered this handler
         */
        function _validate(evt) {
            var component = evt.currentTarget;
            component.reportValidity(evt);
        }

        /**
         * Helper to get the ha-text-field used for searching
         * @param {HTMLElement} select Component to get the text field.
         * @return {HTMLElement} The ha-text-field.
         * @private
         */
        function _getTextField(select) {
            return select.querySelector('.search-container ha-text-field.search');
        }

        /**
         * Helper to get the owner host component (Text Field Type Ahead or Select Type Ahead) given a node
         * @param {HTMLElement} node The element used for searching
         * @return {HTMLElement} Text Field Type Ahead or Select Type Ahead
         * @private
         */
        function _getComponentFromElement(node) {
            return utils.getComponentFromElement(node, 'HA-TEXTFIELD-TYPE-AHEAD') ||
                    utils.getComponentFromElement(node, 'HA-SELECT-TYPE-AHEAD');
        }

        /**
         * Call the popop helper to show the popover menu of the component.
         * @param {HTMLElement} popover The popover with menu items to show.
         * @param {HTMLElement} positionTarget The element that should be used to position the popover when it is opened.
         * @private
         */
        function _showPopover(popover, positionTarget) {
            if (popover) {

                // logically if you think about it, the setting of properties in popoverMenu should be in postRender
                // but due to cloneNode issues, it sets first to true, then the popover.postRender gets called which sets it again to false
                // setting it here guarantees it is always true

                // do not focus on popoverMenu child element on show
                popover._noAutoFocusFirstTabbableElementOnShow = true;
                // when have a popoverMenu open and we click outside it should not focus back to the component
                popover._noAutoFocusLastActiveElementOnClose = true;

                if (popover.open) {
                    popup.setPosition(popover, positionTarget, ['bottom', 'top'], ['left', 'right']);
                } else {
                    popup.show(popover, positionTarget, ['bottom', 'top'], ['left', 'right']);
                }
                currentOpenedPopoverMenu = popover;
            }
        }

        /**
         * Call the popup helper to close the popover menu of the component.
         * @param {HTMLElement} popover The popover to close.
         * @private
         */
        function _hidePopover(popover) {
            popup.hide(popover);
        }

        /**
         * Hide the select popover menu, add styling and for addNew use cases, remove Add New menu item entry
         * @private
         */
        function _hidePopoverMenu(select) {
            var popover = select.querySelector('ha-popover.popover-menu-items');
            select.classList.remove('menu-expanded');
            select._getTriggerElement().setAttribute('aria-expanded', 'false');
            popup.hide(popover);
            currentOpenedPopoverMenu = null;
        }
        /**
         * Add the select item to the items list
         * @param  {HTMLElement}    select  Where to insert the new select item
         * @param  {String}         label   Text and value for the select item
         */
        function _addCreatedItem(select, label) {
            var item,
                storeLabel = select.storeLabelProperty,
                storeValue;

            if (select.tagName === 'HA-TEXTFIELD-TYPE-AHEAD') {
                storeValue = select.storeLabelProperty;
            } else {
                storeValue = select.storeValueProperty;
            }

            if (select.store) {
                item = {};
                item[storeLabel] = label;
                item[storeValue] = label;
                select._cachedItems.push(item);
            } else {
                //TODO: show error message
                console.error('No store defined. Please add a store where items can be retrieved');
            }
        }

        /**
         * Finds selected item on popover form, and updated the corresponding values on the component
         * @param {HTMLElement} select Component to update values
         * @emits HASelect#change
         * @private
         */
        function _setNewElementAsSelected(select) {
            var newItem,
                popoverForm;

            popoverForm = select.addNewPopover.querySelector('ha-popover-form');

            // If there's no addNewNameSelector, we don't know where to get the
            // new item name from
            if (!popoverForm.addNewNameSelector) {
                _hidePopover(select.addNewPopover);
                return;
            }

            newItem = popoverForm.querySelector(popoverForm.addNewNameSelector);

            if (!newItem || !newItem.value) {
                _hidePopover(select.addNewPopover);
                return;
            }

            // New item is added to the dropdown list
            _hidePopover(select.addNewPopover);
            _addCreatedItem(select, newItem.value);

            select.value = newItem.value;
            select.classList.add('element-selected');

            newItem.value = '';

            select.emit('change');
        }

        /**
         * Creates a new menu item
         * @param  {HTMLElement}            select  Where to insert the new menu item
         * @param  {String|HTMLElement}     label   Text for the item
         * @param  {String}                 value   Value for the item
         * @param  {String}                 textLabel   The text of the label attribute without HTML elements
         * @return {HTMLElement}            Created ha-menu-item
         */
        function _createMenuItem(select, label, value, textLabel) {
            var menuItem = select.ownerDocument.createElement('ha-menu-item');
            menuItem.label = label;
            menuItem.value = value || label;
            menuItem.setAttribute('role', 'option');
            if (textLabel) {
                // override aria-label attribute value in order to be sure that we set only text label.
                menuItem.setAttribute('aria-label', textLabel);
            }
            return menuItem;
        }

        /**
         * Sorts items on alphabetical order
         * @param  {Array}  itemsArray      List of items to add to the select
         * @param  {String} compareField    Internal property to use for comparison
         * @private
         */
        function _sortItems(itemsArray, compareField) {
            itemsArray.sort(function(a, b) {
                if (a[compareField] < b[compareField]) {
                    return -1;
                }
                if (a[compareField] > b[compareField]) {
                    return 1;
                }
                return 0;
            });
        }

        /**
         * Filters items using specified filterMode, sorts them alphabetically, adds them to the menu and shows the popover.
         * Items can be of type ha-select-item (if not using store), or literal objects that matches the defined storeLabelProperty and
         *
         * @param  {HTMLElement}    select Component to show
         * @param  {Array}          items  List of items to filter.
         * @private
         */
        function _filterAndShowPopover(select, items) {
            var matchingItems = [],
                currentItem,
                itemsCount,
                currentItemLabel,
                modifiedCurrentItemLabel,
                menu = select.querySelector('ha-menu'),
                localLabel,
                localValue,
                re,
                searchValue,
                i,
                popover,
                positionTarget;

            if (items.length === 0) {
                menu.items = [];
                return;
            }

            searchValue = _getTextField(select).value;

            localLabel = select.storeLabelProperty;
            if (select.tagName === 'HA-TEXTFIELD-TYPE-AHEAD') {
                localValue = select.storeLabelProperty;
                items = [].slice.call(items, 0, STORE_MAX_RESULT);
            } else {
                localValue = select.storeValueProperty;
            }

            if (searchValue === '') {
                if (select.tagName === 'HA-SELECT-TYPE-AHEAD') {
                    items.forEach(function(item) {
                        matchingItems.push(_createMenuItem(select, item[localLabel], item[localValue]));
                    });
                } else {
                    _hidePopoverMenu(select);
                    return;
                }
            } else {
                if (select.filterMode === 'contains') {
                    itemsCount = items.length;
                    re = new RegExp(searchValue, 'gi');
                    for (i = 0; i < itemsCount; i++) {
                        currentItem = items[i];
                        currentItemLabel = currentItem[localLabel];
                        if (re.test(currentItemLabel)) {
                            modifiedCurrentItemLabel = currentItemLabel.replace(re, function replacer(match) {
                                return '<span class="strong">' + match + '</span>';
                            });
                            matchingItems.push(_createMenuItem(select, modifiedCurrentItemLabel, currentItem[localValue], currentItemLabel));
                        }
                    }
                }
            }

            if (!select._alreadySortedItems) {
                _sortItems(matchingItems, 'textContent');
            }

            menu.items = matchingItems;
            if (matchingItems.length > 0 || (matchingItems.length === 0 && select.addNew)) {
                popover = select.querySelector('ha-popover.popover-menu-items');
                popover._closeOnBlur = select._popoverAutoclose;

                if (!select.disabled) {
                    // before showing the popover, add the "Add New" menu item
                    if (select.addNew) {
                        AddNewHelper.addMenuItem(select);
                    }

                    positionTarget = select.querySelector('.search-container');
                    select.classList.add('menu-expanded');
                    select._getTriggerElement().setAttribute('aria-expanded', 'true');

                    _showPopover(popover, positionTarget);
                }
            } else {
                _hidePopoverMenu(select);
            }
        }

        /**
         * Listener for key presses
         * @emits HASelect#keypress
         * @param  {evt} evt Event
         * @private
         */
        function _keyPressListener(evt) {
            var component;

            // These keys should not open the popover
            if (evt.keyCode === keys.TAB || evt.keyCode === keys.ENTER || evt.keyCode === keys.ESC || evt.keyCode === keys.SPACEBAR) {
                return;
            }

            component = _getComponentFromElement(evt.target);
            component._openedByKeyboard = true;
            component._stealFocus = false;
            component._popoverAutoclose = false;
            component._searchOnTimeout();
        }

        /**
         * Update the menu items of the component.
         * @param {HTMLElement} component   The component that will be updated.
         * @private
         */
        function _updateItems(component) {
            var match = '';

            if (!component.staticItems) {
                match = component.typedText;
            }

            component._fetchItems(match, function() {
                component.emit('items-update');
            });
        }

        HATypeAheadBase = classes.createObject(validatable, {

            init: function _() {

                _.super(this);

                this._openedByKeyboard = false;

                this._stealFocus = false;

                this._alreadySortedItems = false;

                this._popoverAutoclose = false;

                /**
                 * Items retrieved from the store. Used only if a store is defined
                 * @type {Array}
                 */
                this._cachedItems = null;

                /**
                 * Repository for items to show on the component
                 * @type {Object}
                 */
                this._store = null;

                /**
                 * Selected item.
                 * @type {HTMLElement}
                 */
                this._selectedItem = null;

                /**
                 * Popover that contains a form to submit a new item for the select
                 * @type {HTMLElement}
                 */
                this._addNewPopover = null;

                /**
                 * Fetches item from the store, and stores them in cache
                 * Finally executes the callback if it's defined
                 * @param  {String}         match       String to match against store
                 * @param  {Function}       callback    Optional. Callback to call after successful query
                 * @private
                 */
                this._fetchItems = function(match, callback) {
                    var queryStore = {'contains': match};
                    match = match || '';
                    this._alreadySortedItems = false;

                    if (this.store && this.store.query) {
                        this.store.query(queryStore).then(function(itemsList) {
                            if (this.staticItems) {
                                // If items are static, we can preorder them
                                _sortItems(itemsList, this.storeLabelProperty);
                                this._alreadySortedItems = true;
                            }

                            this._cachedItems = itemsList;
                            if (callback) {
                                callback(this, itemsList);
                            }
                        }.bind(this));
                    } else {
                        console.error('No store defined or \'query\' method does not exist on the store. Please set a correct store');
                    }

                };

                /**
                 * Gets the items from the corresponding location based on component settings:
                 *  - If no store is defined, throws an error
                 *  - If store is defined, but items are static, uses the cached items
                 *  - Otherwise, fetch the items from the store
                 *  After getting items, they are filtered and results are shown
                 */
                this._matchAndShowResults = function() {
                    if (this.store) {
                        if (this.staticItems && this._cachedItems) {
                            _filterAndShowPopover(this, this._cachedItems);
                        } else {
                            this._fetchItems(_getTextField(this).value, _filterAndShowPopover);
                        }
                    } else {
                        console.error('No store defined. Please add a store where items can be retrieved');
                    }
                };

                /**
                 * Sets a timeout to search for a match
                 */
                /* instanbul ignore next */
                this._searchOnTimeout = function() {
                    var keyWaitTime = 250;
                    if (this._timeOut) {
                        clearTimeout(this._timeOut);
                    }
                    this._timeOut = setTimeout(function() {
                        this._matchAndShowResults();
                    }.bind(this), keyWaitTime);
                };

                this.setupProperties({

                    /**
                     * The filtering mode or algorithm to be used on the candidate items.
                     * @type {String}
                     */
                    filterMode: {
                        default: 'contains'
                    },

                    /**
                     * The property name of a provided store data element that maps to the "label" of the item.
                     * @type {String}
                     */
                    storeLabelProperty: {
                        default: 'label'
                    },

                    /**
                     * Determines whether or not the items provided by the store will be static
                     * @type {Boolean}
                     */
                    staticItems: {
                        default: false,
                        type: Boolean,
                        change: function(newValue) {
                            if (newValue && this.store) {
                                this._fetchItems();
                            } else {
                                this._cachedItems = null;
                            }
                        }
                    },

                    /**
                     * Name of the component.
                     * @type {String}
                     */
                    name: {
                        default: '',
                        type: String,
                        change: function(newValue) {
                            _getTextField(this).name = newValue;
                        }
                    },

                    /**
                     * Add New capability.
                     * @type {Boolean}
                     */
                    addNew: {
                        default: false,
                        type: Boolean
                    },

                    /**
                     * Add New Text.
                     * @type {String}
                     */
                    addNewText: {
                        default: 'Add New',
                        type: String
                    },

                    /**
                     * Value of the selected item.
                     * @type {String}
                     */
                    value: {
                        default: '',
                        type: String,
                        change: function(newValue, oldValue) {
                            var textfield = _getTextField(this),
                                currentItem,
                                i,
                                storeValue;

                            if (this.tagName === 'HA-TEXTFIELD-TYPE-AHEAD') {
                                storeValue = this.storeLabelProperty;
                            } else {
                                storeValue = this.storeValueProperty;
                            }

                            if (newValue === oldValue) {
                                if (newValue) {
                                    this.typedText = this._selectedItem[this.storeLabelProperty];
                                }
                            } else {
                                if (!this.store || !this._cachedItems) {
                                    // This will be evaluated before the possibility to add a store
                                    // so this is not an error situation
                                    return;
                                }

                                for (i = 0; i < this._cachedItems.length; i++) {
                                    currentItem = this._cachedItems[i];

                                    if (currentItem[storeValue] === newValue) {
                                        this._selectedItem = currentItem;
                                        textfield.value = this._selectedItem[this.storeLabelProperty];
                                        this.typedText = this._selectedItem[this.storeLabelProperty];
                                        this.classList.add('element-selected');
                                        return;
                                    }
                                }

                                // If we fail to find the value on the list, we empty the value
                                if (this.tagName === 'HA-TEXTFIELD-TYPE-AHEAD' && !this.addNew) {
                                    textfield.value = newValue;
                                } else {
                                    this.value = '';
                                    textfield.value = this.value;
                                    this._selectedItem = null;
                                    this.classList.remove('element-selected');
                                }
                            }
                        }
                    },

                    /**
                     * This is the placeholder for the textfield.
                     * @type {String}
                     */
                    placeholder: {
                        default: '',
                        change: function(newValue) {
                            _getTextField(this).placeholder = newValue;

                            if (!newValue) {
                                if (this.hasAttribute('placeholder')) {
                                    this.removeAttribute('placeholder');
                                }
                            }
                        }
                    },

                    required: {
                        default: false,
                        type: Boolean,
                        change: function(newValue, oldValue) {
                            var label = this.querySelector('label');

                            if (newValue !== oldValue) {
                                if (label) {
                                    label.textContent = utils.toggleSuffixText(label.textContent, ' *', newValue);
                                }

                                /* istanbul ignore next */
                                if (newValue) {
                                    this.on('ha-popover:close', _validate);
                                    this.on('input:focusout', _validate);
                                } else {
                                    this.off('ha-popover:close', _validate);
                                    this.off('input:focusout', _validate);
                                }
                                this.handleTooltipBinding(newValue);
                            }
                        }
                    }
                });

                /**
                 * Handle save add item button
                 * @emits HASelect#add-new
                 */
                this.on('ha-popover-form:save', function(evt) {
                    utils.stopEvent(evt);
                    _setNewElementAsSelected(this);
                    this.emit('add-new');
                }.bind(this));

                /* Handle cancel add item button */
                this.on('ha-popover-form:cancel', function(evt) {
                    utils.stopEvent(evt);
                    _hidePopover(this.addNewPopover);
                }.bind(this));

                /**
                 * Handle key presses
                 * @emits HASelect#add-new
                 */
                this.on('keydown', function(evt) {
                    var target = evt.target,
                        popoverMenu = this.querySelector('ha-popover.popover-menu-items'),
                        menu = popoverMenu.querySelector('ha-menu'),
                        newFocus,
                        typedText;

                    switch (evt.keyCode) {
                        case keys.TAB:
                            // If TAB is pressed on the input
                            if (target.tagName === 'INPUT' && target.parentElement.classList.contains('search')) {
                                // If shift-tab, we are leaving the component
                                if (evt.shiftKey) {
                                    this.value = this.typedText;
                                    break;
                                }

                                if (popoverMenu.open) {
                                    _hidePopoverMenu(this);
                                }

                                if (this.addNew) {
                                    this._openedByKeyboard = true;
                                    typedText = this.typedText;

                                    if (this.value !== this.typedText) {
                                        this.value = this.typedText;
                                        if (!this.value) {
                                            utils.stopEvent(evt);
                                            this.typedText = typedText;
                                            this.addNewPopover._closeOnBlur = true;
                                            AddNewHelper.showPopoverForm(this, this.addNewPopover);
                                        }
                                    }
                                }
                            } else if (target === this.querySelector('button.action-button')) {
                                if (popoverMenu.open) {
                                    utils.stopEvent(evt);
                                    _hidePopoverMenu(this);
                                }
                            }
                            break;
                        case keys.ESCAPE:
                            // Needed when focus is on input
                            if (popoverMenu.open) {
                                utils.stopEvent(evt);
                                _hidePopoverMenu(this);
                            }
                            // if we moved the mouse over the popover and pressed ESC, it should focus back to the text input
                            if (target.localName === 'ha-menu-item') {
                                _getTextField(this).focus();
                            }
                            break;
                        case keys.DOWN:
                            utils.stopEvent(evt);
                            if (popoverMenu.open) {
                                // if popover is already open and position is bottom
                                if (popoverMenu.classList.contains('position-bottom')) {
                                    newFocus = (menu.items && menu.items.length > 0) ? menu.items[0] : menu;
                                    newFocus.focus();
                                }
                            } else {
                                // open popover if not yet opened
                                this._openedByKeyboard = true;
                                this._popoverAutoclose = true;
                                this._stealFocus = true;
                                this._matchAndShowResults();
                            }
                            break;
                        case keys.UP:
                            utils.stopEvent(evt);
                            if (popoverMenu.open) {
                                // if popover is already open and position is top
                                if (popoverMenu.classList.contains('position-top')) {
                                    newFocus = (menu.items && menu.items.length > 0) ? menu.items[menu.items.length - 1] : menu;
                                    newFocus.focus();
                                }
                            } else {
                                // open popover if not yet opened
                                this._openedByKeyboard = true;
                                this._popoverAutoclose = true;
                                this._stealFocus = true;
                                this._matchAndShowResults();
                            }
                            break;
                        case keys.BACKSPACE:
                        case keys.DELETE:
                            if (target.tagName === 'INPUT' && target.parentElement.classList.contains('search')) {
                                this._openedByKeyboard = true;
                                this._popoverAutoclose = false;
                                this._stealFocus = false;
                                this._searchOnTimeout();
                            }
                    }
                }.bind(this));

                /**
                 * Handle changes of selected elements on menu
                 * @emits HASelect#change
                 */
                this.on('ha-menu:select', function() {
                    var selectedElem,
                        menu = this.querySelector('ha-menu');

                    _hidePopoverMenu(this);
                    selectedElem = menu.selectedItem;

                    /* If the first item 'addNew' and the add new property is true and
                     the addNewPopover is set the, show the last */
                    if (this.addNew && selectedElem.classList.contains('add-new-menu-item')) {
                        this.addNewPopover._closeOnBlur = true;
                        AddNewHelper.showPopoverForm(this, this.addNewPopover);
                        this.emit('add-new');
                    } else {
                        if (this.value === selectedElem.value) {
                            this.typedText = this.value;
                        } else {
                            this.value = selectedElem.value;
                        }
                        this.classList.add('element-selected');
                        // focus on the text field
                        _getTextField(this).focus();
                        this.emit('change');
                    }
                }.bind(this));
            },

            postRender: function _() {
                _.super(this);

                var div = this.querySelector('div.search-container'),
                    textField = _getTextField(this),
                    menu = this.querySelector('ha-menu'),
                    popoverMenu = this.querySelector('ha-popover.popover-menu-items'),
                    popoverForm = this.querySelector('ha-popover-form'),
                    containerId = this.tagName.toLowerCase() + '-' + this.componentId + '-search-container';

                // If we are using declarative/programatic instantiation (not cloning)
                if (!div) {
                    div = this.ownerDocument.createElement('div');
                    div.id = containerId;
                    div.classList.add('search-container');

                    textField = this.ownerDocument.createElement('ha-text-field');
                    textField.classList.add('search');
                    div.appendChild(textField);

                    this.appendChild(div);

                    // create menu
                    menu = this.ownerDocument.createElement('ha-menu');
                    menu.setAttribute('role', 'listbox');

                    // create popover and append menu
                    popoverMenu = this.ownerDocument.createElement('ha-popover');
                    popoverMenu.targetSelector = '#' + containerId;
                    popoverMenu.classList.add('popover-menu-items');
                    popoverMenu.section = menu;
                    this.appendChild(popoverMenu);
                }

                if (popoverForm) {
                    this.addNewPopover = popoverForm.parentNode;
                }

                this.listenTo(textField, 'focus', function() {
                    // Required to be able to style the component when children get focus or hover
                    this.querySelector('.search-container').classList.add('focused');

                    if (currentOpenedPopoverMenu) {
                        _hidePopoverMenu(_getComponentFromElement(currentOpenedPopoverMenu));
                    }
                }.bind(this), true);

                this.listenTo(textField, 'click', function(evt) {
                    evt.stopPropagation();
                    if (!this.disabled) {
                        evt.target.select();
                        // Required to be able to style the component when children get focus or hover
                        this.querySelector('.search-container').classList.add('focused');
                    }
                }.bind(this), true);

                this.listenTo(textField, 'keypress', _keyPressListener, true);

                // This can't be updated on keypress
                this.listenTo(textField, 'keyup', function() {
                    this.typedText = _getTextField(this).value;
                }.bind(this), true);

                this.listenTo(popoverMenu, 'show', function(evt) {
                    evt.stopPropagation();
                }.bind(this));

                this.listenTo(popoverMenu, 'close', function(evt) {
                    evt.stopPropagation();

                    if (this.addNew) {
                        // remove Add New menu item
                        this.querySelector('ha-menu').remove(0);
                    }
                    // make sure to remove always
                    this._getTriggerElement().setAttribute('aria-expanded', 'false');
                    this.classList.remove('menu-expanded');
                }.bind(this));

                // backward-compatibility popover hide event, we should stop bubbling
                this.listenTo(popoverMenu, 'hide', function(evt) {
                    evt.stopPropagation();
                }.bind(this));

                this.listenTo(this, 'blur', function(evt) {
                    var target = evt.target;

                    if (target === textField.querySelector('input') || target === popoverMenu) {
                        // if target is popoverMenu when user passes his mouse over the popover and clicks
                        // on another component, this makes sure to hide the popover
                        this._blurCheck(evt);
                    }
                }.bind(this), true);
            },

            /**
             * Gets the store object
             */
            get store() {
                return this._store;
            },

            /**
             * Sets new store object.
             * Empties items, cached items, and current value
             * @param  {Object} newValue Store that contains the items
             */
            set store(newValue) {
                this._store = newValue;

                this._cachedItems = [];
                this.value = '';

                if (this.staticItems) {
                    this._fetchItems();
                }

                if (this._store && this._store.on) {
                    this._store.on('add', function() {
                        _updateItems(this);
                    }.bind(this));

                    this._store.on('delete', function() {
                        _updateItems(this);
                    }.bind(this));
                }
            },

            /**
             * Gets the ha-popover element that will host the ha-popover-form for adding a new item
             */
            get addNewPopover() {
                return this._addNewPopover;
            },

            /**
             * Sets the ha-popover element that will host the ha-popover-form for adding a new item
             * @param  {HTMLElement} newPopover Popover to store
             */
            set addNewPopover(newPopover) {
                var id = this.querySelector('.search-container').id;
                if (this.addNewPopover && this.addNewPopover !== newPopover) {
                    this.removeChild(this.addNewPopover);
                }
                this._addNewPopover = newPopover;
                if (newPopover) {
                    if (newPopover.targetSelector) {
                        newPopover.targetSelector = '#' + id;
                    } else {
                        newPopover.setAttribute('targetSelector', '#' + id);
                    }
                    newPopover.classList.add('popover-add-items');
                    // when have a popover open and we click outside it should not focus back to the component
                    // use this flag to tell the popover to not focus back, see popover _animationListenerEnd
                    newPopover._owner = this;
                    this.appendChild(newPopover);
                }
            },

            /**
             * Gets the typedText
             */
            get typedText() {
                var textField = _getTextField(this);
                return textField.value;
            },

            /**
             * value that currently appears in the editable text field.
             * @type {String}
             */
            set typedText(newValue) {
                var textfield = _getTextField(this);
                if (textfield.value !== newValue) {
                    textfield.value = newValue;
                }
                if (this.tagName === 'HA-TEXTFIELD-TYPE-AHEAD' && !this.addNew) {
                    this.value = this.typedText;
                }
            },

            /**
             * Checks if focus has left the component, in which case hides the popover
             * @param {evt} evt Event that triggered the blur
             */
            _blurCheck: function(evt) {
                var component = _getComponentFromElement(evt.target),
                    safeTarget = utils.getSafeTargetFromEvent(evt);

                component.querySelector('.search-container').classList.remove('focused');

                if (!component.contains(safeTarget)) {
                    _hidePopoverMenu(component);
                    if (component.tagName === 'HA-SELECT-TYPE-AHEAD' && component.typedText !== component.value) {
                        component.value = '';
                        component.typedText = '';
                    }

                    component.emit('blur');
                }
            },

            _getInputElement: function() {
                return this.querySelector('.search-container ha-text-field.search')._getInputElement();
            }
        });

        return HATypeAheadBase;

    });

define('hui/select-type-ahead',[
    'register-component/v2/register',
    'object-utils/classes',
    './typeahead-base',
    './core/popup',
    './core/keys',
    './core/utils',
    './popover',
    './popover-form',
    './menu',
    './menu-item',
    './text-field'
],
function(register, classes, typeaheadBase, popup, keys, utils) {
    'use strict';
    var HASelectTypeAhead;

    function _triggerElementClickListener(component) {
        var popoverMenu = component.querySelector('ha-popover.popover-menu-items');

        if (component.addNewPopover && component.addNewPopover.open) {
            popup.hide(component.addNewPopover);
        } else if (popoverMenu.open) {
            popup.hide(popoverMenu);
        } else {
            component._openedByKeyboard = false;
            component._stealFocus = true;
            component._popoverAutoclose = true;
            component._matchAndShowResults(component);
        }
        component.emit('click');
    }

    HASelectTypeAhead = classes.createObject(typeaheadBase, {

        init: function _() {

            _.super(this);

            /**
             * The element that the validator will use to get the values to validate
             * @type {HTMLElement}
             */
            this.validationTarget = this;

            /**
             * The selector for the elements to highlight if an error is detected
             * @type {String}
             */
            this.highlightElementSelector = '.search input';

            this.setupProperties({
                /**
                 * The label for this select.
                 * @property label
                 * @type {String}
                 */
                label: {
                    default: '',
                    type: String,
                    change: function(newValue) {
                        var label = this.querySelector('label'),
                            button = this.querySelector('.action-button'),
                            // FIXME: we reached the local ha-text-field local input just to set attributes
                            textFieldLocalInput = this.querySelector('.search-container ha-text-field input'),
                            labelId;

                        if (newValue) {
                            if (!label) {
                                label = this.ownerDocument.createElement('label');
                                this.insertBefore(label, this.firstElementChild);

                                labelId = this.localName + '-label-' + this.componentId;
                                label.setAttribute('id', labelId);
                                label.setAttribute('for', textFieldLocalInput.id);
                                button.setAttribute('aria-describedby', labelId);
                            } else {
                                // label exists already, use it's id to set
                                textFieldLocalInput.id = label.getAttribute('for');
                            }

                            label.textContent = utils.toggleSuffixText(newValue, ' *', this.required);
                            textFieldLocalInput.removeAttribute('aria-label');
                        } else {
                            if (label) {
                                this.removeChild(label);
                                button.removeAttribute('aria-describedby');
                            }
                            if (this.placeholder) {
                                textFieldLocalInput.setAttribute('aria-label', this.placeholder);
                            }
                        }
                    }
                },

                /**
                 * Disabled indicates if the menu button is disabled.
                 * @type {Boolean}
                 */
                disabled: {
                    default: false,
                    type: Boolean,
                    change: function(newValue) {
                        this.querySelector('button.action-button').disabled = newValue;
                        this.querySelector('ha-text-field.search').disabled = newValue;
                        if (newValue) {
                            this.classList.add('disabled');
                        } else {
                            this.classList.remove('disabled');
                        }
                    }
                },

                /**
                 * The property name of a provided store data element that maps to the "value" of the item.
                 * @type {String}
                 */
                storeValueProperty: {
                    default: 'value'
                },

                /**
                 * Number of elements before showing a scrollbar.
                 * @type {Integer}
                 */
                size: {
                    default: 10,
                    type: Number,
                    change: function(newValue) {
                        var menu = this.querySelector('ha-menu'),
                            isMenuRendered = !!menu.render;
                        if (isMenuRendered) {
                            menu.size = newValue;
                        } else {
                            menu.setAttribute('size', newValue);
                        }
                    }
                }
            });
        },

        postRender: function _() {
            _.super(this);

            var triggerElement = this.querySelector('button.action-button'),
                div = this.querySelector('div.search-container'),
                arrowUp,
                arrowDown,
                accesibilityTextNode,
                popoverMenu = this.querySelector('ha-popover.popover-menu-items');

            // If we are using declarative/programatic instantiation (not cloning)
            if (!triggerElement) {
                triggerElement = this.ownerDocument.createElement('button');
                triggerElement.type = 'button';
                triggerElement.classList.add('action-button');
                triggerElement.setAttribute('aria-expanded', 'false');
                triggerElement.setAttribute('aria-haspopup', 'true');

                arrowUp = this.ownerDocument.createElement('span');
                arrowUp.classList.add('caret');
                triggerElement.appendChild(arrowUp);

                arrowDown = this.ownerDocument.createElement('span');
                arrowDown.classList.add('caret');
                triggerElement.appendChild(arrowDown);

                accesibilityTextNode = this.ownerDocument.createElement('span');
                accesibilityTextNode.classList.add('sr-only');
                accesibilityTextNode.innerHTML = 'Display options';
                triggerElement.appendChild(accesibilityTextNode);

                div.appendChild(triggerElement);
            }

            this.listenTo(triggerElement, 'focus', function() {
                // Required to be able to style the component when children get focus or hover
                this.querySelector('.search-container').classList.add('focused');
            }.bind(this), true);

            this.listenTo(triggerElement, 'click', function(evt) {
                if (this.disabled) {
                    return;
                }

                evt.stopPropagation();

                // FF and Safari looses focus on the triggerElement when clicked
                // use workaround below to focus again
                triggerElement.focus();
                _triggerElementClickListener(this);
            }.bind(this));

            this.listenTo(triggerElement, 'blur', function(evt) {
                this._blurCheck(evt);
            }.bind(this), true);

            this.listenTo(triggerElement, 'keydown', function(evt) {
                if (evt.keyCode === keys.SPACEBAR || evt.keyCode === keys.ENTER) {
                    // If focus in on button with arrows
                    if (evt.target.classList.contains('action-button')) {
                        utils.stopEvent(evt);
                        if (!popoverMenu.open) {
                            this._openedByKeyboard = true;
                            this._popoverAutoclose = true;
                            this._stealFocus = true;
                            this._matchAndShowResults(this);
                        }
                    }
                } else if (evt.keyCode === keys.TAB) {
                    /* istanbul ignore if */
                    if (!evt.shiftKey && this.typedText !== this.value) {
                        this.value = this.typedText;
                    }
                }
            }.bind(this), true);

            // Fix for firefox triggering click when pressing spacebar
            this.listenTo(triggerElement, 'keyup', function(evt) {
                /* istanbul ignore if */
                if (evt.keyCode === keys.SPACEBAR) {
                    evt.preventDefault();
                }
            }, true);
        },

        /**
         * Dummy method to avoid problems with getter without setters
         */
        set selectedItem(newValue) {
            // jshint unused:false
        },

        /**
         * Gets the selected item from the menu
         */
        get selectedItem() {
            return this._selectedItem;
        },

        _getTriggerElement: function() {
            return this.querySelector('button.action-button');
        }
    });
    return register('ha-select-type-ahead', HASelectTypeAhead);
});

define('hui/select',[
    './validatable/validatable',
    'register-component/v2/register',
    './core/popup',
    './core/keys',
    './core/utils',
    'object-utils/classes',
    './add-new-helper',
    './popover',
    './popover-form',
    './menu',
    './menu-item'
],
function(validatable, register, popup, keys, utils, classes, AddNewHelper) {
    'use strict';

    var HASelect,

        /**
         * Flag that establish if popover was opened by click on keyboard
         * @type {Boolean}
         */
        openedByKeyboard = false;

    /**
     * Helper to show the popover based on positionTarget
     * @param {HTMLElement} popover The popover with menu items to show.
     * @param {HTMLElement} positionTarget The element that should be used to position the popover when it is opened.
     * @private
     */
    function _showPopover(popover, positionTarget) {
        if (popover) {
            if (popover.open) {
                popup.setPosition(popover, positionTarget, ['bottom', 'top'], ['left', 'right']);
            } else {
                popup.show(popover, positionTarget, ['bottom', 'top'], ['left', 'right']);
            }
        }
    }

    /**
     * Helper to hide the popover
     * @param {ha-popover} popover the popover to hide
     * @private
     */
    function _hidePopover(popover) {
        popup.hide(popover);
    }

    function _showPopoverMenu(popover, triggerElement) {
        triggerElement.classList.add('menu-expanded');
        triggerElement.setAttribute('aria-expanded', 'true');

        // logically if you think about it, the setting of properties in popoverMenu should be in postRender
        // but due to cloneNode issues, it sets first to true, then the popover.postRender gets called which sets it again to false
        // setting it here guarantees it is always true

        // do not focus on popoverMenu child element on show
        popover._noAutoFocusFirstTabbableElementOnShow = true;
        // when have a popoverMenu open and we click outside it should not focus back to the component
        popover._noAutoFocusLastActiveElementOnClose = true;

        // the positionTarget is the triggerElement in this case
        _showPopover(popover, triggerElement);
    }

    function _hidePopoverMenu(popover, triggerElement) {
        triggerElement.setAttribute('aria-expanded', 'false');
        triggerElement.classList.remove('menu-expanded');
        _hidePopover(popover);
    }

    /**
     * Creates a new select item
     * @param  {HTMLElement}    select  Where to insert the new select item
     * @param  {String}         value   Value for the select item
     * @param  {String}         label   Text for the select item
     * @return {HTMLElement}            Created select item
     */
    function _createSelectItem(select, value, label) {
        var item = select.ownerDocument.createElement('ha-item');
        item.label = label;
        item.value = value;
        return item;
    }

    /**
     * Add the select item to the items list
     * @param  {HTMLElement}    select  Where to insert the new select item
     * @param  {String}         label   Text and value for the select item
     */
    function _addHAItemElem(select, label) {
        var selectItem = _createSelectItem(select, label, label),
            items = select.items;

        items.unshift(selectItem);
        select.items = items;
    }

    /**
     * Finds selected item on popover form, and updated the corresponding values on the component
     * @param {HTMLElement} select Component to update values
     * @emits HASelect#change
     */
    function _setNewElementAsSelected(select) {
        var newItem,
            popoverForm;

        popoverForm = select.addNewPopover.querySelector('ha-popover-form');

        // If there's no addNewNameSelector, we don't know where to get the
        // new item name from
        if (!popoverForm.addNewNameSelector) {
            _hidePopover(select.addNewPopover);
            return;
        }

        newItem = popoverForm.querySelector(popoverForm.addNewNameSelector);

        if (!newItem || !newItem.value) {
            _hidePopover(select.addNewPopover);
            return;
        }

        // New item is added to the dropdown list
        _hidePopover(select.addNewPopover);
        _addHAItemElem(select, newItem.value);

        select.value = newItem.value;
        select.classList.add('element-selected');

        newItem.value = '';

        select.emit('change');
    }

    HASelect = classes.createObject(validatable, {

        init: function _() {

            _.super(this);

            /**
             * The element that the validator will use to get the values to validate
             * @type {HTMLElement}
             */
            this.validationTarget = this;

            /**
             * The selector for the elements to highlight if an error is detected
             * @type {String}
             */
            this.highlightElementSelector = '.action-button';

            this._items = null;

            /**
             * Popover that contains a form to submit a new item for the select
             * @type {HTMLElement}
             */
            this._addNewPopover = null;

            this.setupProperties({

                /**
                 * Number of elements before showing a scrollbar.
                 * @type {Integer}
                 */
                size: {
                    default: 10,
                    type: Number,
                    change: function(newValue) {
                        var menu = this.querySelector('ha-menu'),
                            isMenuRendered = !!menu.render;
                        if (isMenuRendered) {
                            menu.size = newValue;
                        } else {
                            menu.setAttribute('size', newValue);
                        }
                    }
                },
                /**
                 * Selected item index.
                 * @type {Integer}
                 */
                selectedIndex: {
                    default: -1,
                    type: Number,
                    change: function(newValue, oldValue) {
                        if (newValue !== oldValue) {
                            var menu = this.querySelector('ha-menu');

                            if (newValue === -1) {
                                menu.selectedIndex = -1;
                                this.value = '';
                            } else if (this.items && newValue > -1 && newValue < this.items.length && newValue !== oldValue) {
                                if (this.addNew && this.items.length !== menu.items.length) {
                                    menu.selectedIndex = this.selectedIndex + 1;
                                } else {
                                    menu.selectedIndex = this.selectedIndex;
                                }
                                if (menu.selectedItem) {
                                    this.value = menu.selectedItem.value;
                                }
                            } else {
                                this.selectedIndex = -1;
                            }
                        }
                    }
                },
                /**
                 * Name of the component.
                 * @type {String}
                 */
                name: {
                    default: '',
                    type: String
                },

                /**
                 * Add New capability.
                 * @type {Boolean}
                 */
                addNew: {
                    default: false,
                    type: Boolean
                },

                /**
                 * Add New Text.
                 * @type {String}
                 */
                addNewText: {
                    default: 'Add New',
                    type: String
                },

                /**
                 * Value of the selected item.
                 * @type {String}
                 */
                value: {
                    default: '',
                    type: String,
                    change: function(newValue, oldValue) {
                        var menu = this.querySelector('ha-menu'),
                            isMenuRendered = !!menu.render,
                            label = this.querySelector('span.label'),
                            i;
                        if (!newValue) {
                            label.innerHTML = this.placeholder;
                            this.value = '';
                            this.classList.remove('element-selected');
                            return;
                        }
                        if (newValue !== oldValue) {
                            if (!isMenuRendered) {
                                return;
                            }

                            // If the value is the same as the already selected on the menu
                            // we avoid searching the item on the list
                            if (menu.selectedItem && menu.selectedItem.value === newValue) {
                                // As the menu considers the add new button as an item and the
                                // select doesn't we have to take it into account when setting
                                // the selectedIndex prop.
                                if (this.addNew && this.items.length !== menu.items.length) {
                                    this.selectedIndex = menu.selectedIndex - 1;
                                } else {
                                    this.selectedIndex = menu.selectedIndex;
                                }
                                label.innerHTML = menu.selectedItem.label;
                                return;
                            }

                            for (i = 0; i< menu.items.length; i++) {
                                if (menu.items[i].value === newValue) {
                                    this.selectedIndex = i;
                                    label.innerHTML = menu.items[i].label;
                                    return;
                                }
                            }

                            // If we fail to find the value on the list, we keep the old value
                            label.innerHTML = this.placeholder;
                            this.value = '';
                            this.classList.remove('element-selected');
                        }
                    }
                },

                /**
                 * Disabled indicates if the menu button is disabled.
                 * @type {Boolean}
                 */
                disabled: {
                    default: false,
                    type: Boolean,
                    change: function(newValue) {
                        this.querySelector('button.action-button').disabled = newValue;
                    }
                },

                /**
                 * This is the text for the button.
                 * @type {String}
                 */
                placeholder: {
                    default: '',
                    change: function(newValue, oldValue) {
                        var button = this.querySelector('button.action-button');
                        if (newValue !== oldValue) {
                            this.querySelector('span.label').innerHTML = newValue;

                            if (button.hasAttribute('aria-label')) {
                                button.setAttribute('aria-label', newValue);
                            }

                            if (!newValue && !this.label) {
                                button.removeAttribute('aria-label');
                            }
                        }
                    }
                },

                /**
                 * The label for this select.
                 * @property label
                 * @type {String}
                 */
                label: {
                    default: '',
                    type: String,
                    change: function(newValue) {
                        var label = utils.getDirectChildByType(this, 'label'),
                            button = this.querySelector('.action-button'),
                            labelId;

                        if (newValue) {
                            if (!label) {
                                label = this.ownerDocument.createElement('label');
                                this.insertBefore(label, this.querySelector('.action-button'));

                                labelId = this.localName + '-label-' + this.componentId;
                                label.setAttribute('id', labelId);
                                button.setAttribute('aria-describedby', labelId);
                            }

                            label.textContent = utils.toggleSuffixText(newValue, ' *', this.required);
                            button.removeAttribute('aria-label');
                        } else {
                            if (label) {
                                this.removeChild(label);
                                button.removeAttribute('aria-describedby');
                            }
                            if (this.placeholder) {
                                button.setAttribute('aria-label', this.placeholder);
                            }
                        }
                    }
                },

                required: {
                    default: false,
                    type: Boolean,
                    change: function(newValue, oldValue) {
                        var label = this.querySelector('label');

                        if (newValue !== oldValue) {
                            if (label) {
                                label.textContent = utils.toggleSuffixText(label.textContent, ' *', newValue);
                            }

                            /* istanbul ignore next */
                            if (newValue !== oldValue) {
                                if (newValue) {
                                    this.on('ha-popover:hide', this.validate);
                                } else {
                                    this.off('ha-popover:hide', this.validate);
                                }
                                this.handleTooltipBinding(newValue);
                            }

                            this.querySelector('button.action-button').setAttribute('aria-required', newValue);
                        }
                    }
                }
            });

            /**
             * Handle save add item button
             * @emits HASelect#add-new
             */
            this.on('ha-popover-form:save', function(evt) {
                utils.stopEvent(evt);
                _setNewElementAsSelected(this);
                this.emit('add-new');
            }.bind(this));

            /* Handle cancel add item button */
            this.on('ha-popover-form:cancel', function(evt) {
                utils.stopEvent(evt);
                _hidePopover(this.addNewPopover);
            }.bind(this));

            /**
             * Handle changes of selected elements on menu
             * @emits HASelect#change
             */
            this.on('ha-menu:select', function(evt) {
                var selectedElem,
                    triggerElement = this.querySelector('button.action-button'),
                    menu = this.querySelector('ha-menu');

                _hidePopoverMenu(this.querySelector('.popover-menu-items'), triggerElement);
                selectedElem = menu.selectedItem;

                /* If the first item 'addNew' and the add new property is true and
                 the addNewPopover is set the, show the last */
                if (this.addNew && selectedElem.classList.contains('add-new-menu-item')) {
                    this.addNewPopover._closeOnBlur = true;
                    menu.selectedIndex = -1;
                    AddNewHelper.showPopoverForm(this, this.addNewPopover);
                    this.emit('add-new');
                } else {
                    this.value = selectedElem.value;
                    this.classList.add('element-selected');
                    // focus on the triggerElement when the event came from keyboard or click
                    // this prevents focusing when we set the this.value which also fires a select event
                    if (evt.detail && evt.detail.selectedByClickOrKeyboard) {
                        triggerElement.focus();
                    }

                    this.emit('change');
                }
            }.bind(this));
        },

        /**
         * The id used for the local button id which also matches the targetSelector of the popover
         * @private
         * return {String} id
         */
        _getTargetSelectorId: function() {
            return this.localName + '-target-' + this.componentId;
        },

        postRender: function _() {
            _.super(this);

            var triggerElement = this.querySelector('button.action-button'),
                label,
                arrowUp, arrowDown,
                popoverMenu = this.querySelector('ha-popover.popover-menu-items'),
                menu = this.querySelector('ha-menu'),
                popoverForm = this.querySelector('ha-popover-form'),
                targetSelectorId = this._getTargetSelectorId();

            if (!triggerElement) {
                // create trigger button
                triggerElement = this.ownerDocument.createElement('button');
                triggerElement.type = 'button';
                triggerElement.className = 'action-button no-connector';
                triggerElement.id = targetSelectorId;
                triggerElement.setAttribute('aria-expanded', 'false');
                triggerElement.setAttribute('aria-haspopup', 'true');

                label = this.ownerDocument.createElement('span');
                label.classList.add('label');
                triggerElement.appendChild(label);

                // create arrow up and down caret
                arrowUp = this.ownerDocument.createElement('span');
                arrowUp.classList.add('caret');
                triggerElement.appendChild(arrowUp);

                arrowDown = this.ownerDocument.createElement('span');
                arrowDown.classList.add('caret');
                triggerElement.appendChild(arrowDown);

                this.appendChild(triggerElement);

                // create menu
                menu = this.ownerDocument.createElement('ha-menu');
                menu.setAttribute('role', 'listbox');

                // create popover and append menu
                popoverMenu = this.ownerDocument.createElement('ha-popover');
                popoverMenu.classList.add('popover-menu-items');
                popoverMenu.targetSelector = '#' + targetSelectorId;
                popoverMenu.appendChild(menu);

                this.appendChild(popoverMenu);
            }

            this.items = Array.prototype.slice.call(this.querySelectorAll('ha-item'));

            if (popoverForm) {
                this.addNewPopover = popoverForm.parentNode;
            }

            this.listenTo(triggerElement, 'click', function(evt) {
                if (this.disabled) {
                    return;
                }

                // should not emit click events
                evt.stopPropagation();

                // FF and Safari looses focus on the triggerElement when clicked
                // use workaround below to focus again
                triggerElement.focus();

                if (this.addNewPopover && this.addNewPopover.open) {
                    _hidePopover(this.addNewPopover);
                } else if (popoverMenu.open) {
                    _hidePopoverMenu(popoverMenu, triggerElement);
                } else {
                    if (this.addNew) {
                        AddNewHelper.addMenuItem(this);
                    }
                    _showPopoverMenu(popoverMenu, triggerElement);
                    openedByKeyboard = false;
                    this.emit('click');
                }
            }.bind(this));

            this.listenTo(triggerElement, 'keydown', function(evt) {
                var newFocus;

                switch (evt.keyCode) {
                    case keys.SPACEBAR:
                    case keys.ENTER:
                        utils.stopEvent(evt);
                        if (!popoverMenu.open) {
                            if (this.addNew) {
                                AddNewHelper.addMenuItem(this);
                            }
                            openedByKeyboard = true;
                            _showPopoverMenu(popoverMenu, triggerElement);
                        }
                        break;
                    case keys.DOWN:
                        utils.stopEvent(evt);
                        if (popoverMenu.open) {
                            // if popover is already open and position is bottom
                            if (popoverMenu.classList.contains('position-bottom')) {
                                newFocus = (menu.items && menu.items.length > 0) ? menu.items[0] : menu;
                                newFocus.focus();
                            }
                        } else {
                            // open popover if not yet opened and add Add New menu item
                            if (this.addNew) {
                                AddNewHelper.addMenuItem(this);
                            }
                            openedByKeyboard = true;
                            _showPopoverMenu(popoverMenu, triggerElement);
                        }
                        break;
                    case keys.UP:
                        utils.stopEvent(evt);
                        if (popoverMenu.open) {
                            // if popover is already open and position is top
                            if (popoverMenu.classList.contains('position-top')) {
                                newFocus = (menu.items && menu.items.length > 0) ? menu.items[menu.items.length - 1] : menu;
                                newFocus.focus();
                            }
                        } else {
                            // open popover if not yet opened and add Add New menu item
                            if (this.addNew) {
                                AddNewHelper.addMenuItem(this);
                            }
                            openedByKeyboard = true;
                            _showPopoverMenu(popoverMenu, triggerElement);
                        }
                        break;
                }
            }.bind(this), true);

            this.listenTo(popoverMenu, 'show', function(evt) {
                evt.stopPropagation();

                // focus the actual menu item if opened via keyboard and there is a default selection
                if (openedByKeyboard && menu.selectedItem) {
                    menu.selectedItem.focus();
                }
            }.bind(this));

            this.listenTo(popoverMenu, 'close', function(evt) {
                evt.stopPropagation();

                if (this.addNew) {
                    // remove Add New menu item
                    menu.remove(0);
                }
            }.bind(this));

            // backward-compatibility popover hide event, stop bubbling
            this.listenTo(popoverMenu, 'hide', function(evt) {
                evt.stopPropagation();
            }.bind(this));

            this.listenTo(this, 'blur', function(evt) {
                var safeTarget = utils.getSafeTargetFromEvent(evt);

                if (evt.target === popoverMenu || evt.target === triggerElement) {
                    if (!this.contains(safeTarget)) {
                        // at this point we have moved outside, hide all popover and emit blur so
                        // that validation can receive it
                        _hidePopoverMenu(popoverMenu, triggerElement);
                        this.emit('blur');
                    }
                }
            }.bind(this), true);

            /**
             * Handle key presses
             * @emits HASelect#add-new
             */
            this.on('keydown', function(evt) {
                if (this.disabled) {
                    return;
                }

                var target = evt.target;

                switch (evt.keyCode){
                    case keys.TAB:
                    case keys.ESCAPE:
                        if (popoverMenu.open) {
                            utils.stopEvent(evt);
                            _hidePopoverMenu(popoverMenu, triggerElement);
                            // focuses back to the triggerElement so that pressing SPACE opens the popover again
                            triggerElement.focus();
                        }
                        break;
                    case keys.ENTER:
                    case keys.SPACEBAR:
                        if (target.tagName === 'HA-MENU') {
                            utils.stopEvent(evt);
                            openedByKeyboard = true;
                            if (this.addNew) {
                                AddNewHelper.showPopoverForm(this, this.addNewPopover);
                            }
                        }
                        break;
                }
            }.bind(this));

            // Fix for FF triggering click when pressing spacebar
            this.listenTo(triggerElement, 'keyup', function(evt) {
                /* istanbul ignore if */
                if (evt.keyCode === keys.SPACEBAR) {
                    evt.preventDefault();
                }
            }, true);
        },

        /**
         * Gets the selected item from the menu
         */
        get selectedItem() {
            return Array.isArray(this.items) && this.selectedIndex > -1 ? this.items[this.selectedIndex] : null;
        },

        /**
         * Dummy method to avoid problems with getter without setters
         */
        set selectedItem(newValue) {
            // jshint unused:false
        },

        /**
         * Gets the ha-popover that will host the ha-menu with the list of items
         */
        get items() {
            return this._items;
        },

        /**
         * Sets the element that is contained inside the ha-popover
         * @param  {Array} items List of items to store
         */
        set items(items) {
            var menu = this.querySelector('ha-menu'),
                menuItems,
                menuItem,
                selectItems,
                isMenuRendered = !!menu.render;

            // Remove all ha-items.
            // Should enter here only if we are replacing items with javascript
            selectItems = Array.prototype.slice.call(this.querySelectorAll('ha-item'));
            selectItems.forEach(function(selectItem) {
                selectItem.parentElement.removeChild(selectItem);
            }.bind(this));

            // Remove all menu-items
            if (isMenuRendered) {
                // If menu is rendered
                while (menu.items.length > 0) {
                    menu.remove(0);
                }
            } else {
                // If menu is not rendered yet
                menuItems = Array.prototype.slice.call(this.querySelectorAll('ha-menu-item'));
                menuItems.forEach(function(menuItem) {
                    menu.removeChild(menuItem);
                }.bind(this));
            }

            this._items = items;

            items.forEach(function(selectItem, index) {
                menuItem = this.ownerDocument.createElement('ha-menu-item');
                menuItem.setAttribute('role', 'option');
                // If selectItem is not rendered yet, I need to check the innerHTML to find out the label.
                // We should find a better way
                menuItem.label = selectItem.label || selectItem.innerHTML;
                menuItem.value = selectItem.value || selectItem.getAttribute('value');
                if (isMenuRendered) {
                    // If menu is rendered
                    menu.add(menuItem, index);
                } else {
                    // If menu is not rendered yet
                    menu.appendChild(menuItem);
                }

                this.insertBefore(selectItem, this.querySelector('.popover-menu-items'));
            }, this);
        },

        /**
         * Gets the ha-popover element that will host the ha-popover-form for adding a new item
         */
        get addNewPopover() {
            return this._addNewPopover;
        },

        /**
         * Sets the ha-popover element that will host the ha-popover-form for adding a new item
         * @param  {HTMLElement} newPopover Popover to store
         */
        set addNewPopover(newPopover) {
            if (this.addNewPopover && this.addNewPopover !== newPopover) {
                this.removeChild(this.addNewPopover);
            }

            this._addNewPopover = newPopover;

            if (newPopover) {
                newPopover.classList.add('popover-add-items');
                if (newPopover.parentElement !== this) {
                    this.appendChild(newPopover);
                }
                newPopover.targetSelector = '#' + this.querySelector('button.action-button').id;
            }
        },

        // on initial render in templating engines the nested components are still rendering and setting defaults
        // then the popover add items targetSelector is still '_previousSibling'
        // use the attachedCallback to set it again
        attachedCallback: function() {
            if (this._addNewPopover) {
                this._addNewPopover.targetSelector = '#' + this.querySelector('button.action-button').id;
            }
        },

        /**
         * Runs the necessary validations over the component
         * @param  {Event} evt  The event that triggered this handler
         */
        validate: function(evt) {
            var component = evt.currentTarget;
            component.reportValidity(evt);
        }
    });
    return register('ha-select', HASelect);
});

define('hui/combo-link',[
    'object-utils/classes',
    'register-component/v2/register',
    './menu/menu-based-buttons',
    './core/utils'
], function(classes, register, MenuBasedButtons, utils) {
    'use strict';

    var HAComboLink = classes.createObject(MenuBasedButtons, {
        _renderTriggerElement: function() {
            var actionButton, label, triggerElement, buttonCaret, btnGroup;

            // create action button
            actionButton = this.ownerDocument.createElement('button');
            actionButton.type = 'button';
            actionButton.className = 'btn btn-link';

            label = this.ownerDocument.createElement('span');
            label.className = 'label';
            actionButton.appendChild(label);

            // create trigger button
            triggerElement = this.ownerDocument.createElement('button');
            triggerElement.type = 'button';
            triggerElement.className = 'btn hi-icon-button btn-link no-connector';
            triggerElement.id = this._getTargetSelectorId();
            triggerElement.setAttribute('aria-expanded', 'false');
            triggerElement.setAttribute('aria-haspopup', 'true');
            triggerElement.setAttribute('aria-label', this.label + ' menu');

            buttonCaret = this.ownerDocument.createElement('span');
            buttonCaret.className = 'caret';
            triggerElement.appendChild(buttonCaret);

            // Create the btn group
            btnGroup = this.ownerDocument.createElement('div');
            btnGroup.className = 'btn-group';
            btnGroup.appendChild(actionButton);
            btnGroup.appendChild(triggerElement);

            this.appendChild(btnGroup);

            return triggerElement;
        },

        _getTriggerElement: function() {
            return this.querySelector('button.hi-icon-button');
        },

        /**
        * We re-emit click events coming from local dom so that the evt.target is the host component
        * @emits click
        */
        attachedCallback: function _() {
            _.super(this);

            var button, label;

            button = this.querySelector('.btn-group > button');

            // needed because when spacebar is pressed it goes to this code path
            this.listenTo(button, 'click', function(evt) {
                utils.stopEvent(evt);
                this.emit('click');
            }.bind(this));

            label = button.querySelector('span.label');
            this.listenTo(label, 'click', function(evt) {
                utils.stopEvent(evt);
                this.emit('click');
            }.bind(this));
        }
    });

    return register('ha-combo-link', HAComboLink);
});

define('hui/combo-button',[
    'object-utils/classes',
    'register-component/v2/register',
    './menu/menu-based-buttons',
    './core/utils'
],
function(classes, register, MenuBasedButtons, utils) {
    'use strict';

    var buttonClasses = ['ha-button-default', 'ha-button-primary', 'ha-button-dark'],
        HAComboButton;

    HAComboButton = classes.createObject(MenuBasedButtons, {
        init: function _() {
            _.super(this);

            this.setupProperties({
                /**
                 * Disabled indicates if the combo button is disabled.
                 * @type {Boolean}
                 */
                disabled: {
                    default: false,
                    type: Boolean,
                    change: function(newValue) {
                        var actionButton = this.querySelector('.combo-button-action'),
                            dropdownButton = this.querySelector('.combo-button-dropdown');

                        if (newValue) {
                            actionButton.disabled = true;
                            dropdownButton.disabled = true;
                        } else {
                            actionButton.disabled = false;
                            dropdownButton.disabled = false;
                        }
                    }
                }
            });
        },

        _renderTriggerElement: function() {
            var actionButton, label, triggerElement, buttonCaret;

            // create action button
            actionButton = this.ownerDocument.createElement('button');
            actionButton.type = 'button';
            actionButton.className = 'ha-button combo-button-action';

            label = this.ownerDocument.createElement('span');
            label.className = 'label';
            actionButton.appendChild(label);

            this.appendChild(actionButton);

            // create trigger button
            triggerElement = this.ownerDocument.createElement('button');
            triggerElement.type = 'button';
            triggerElement.className = 'ha-button combo-button-dropdown no-connector';
            triggerElement.id = this._getTargetSelectorId();
            triggerElement.setAttribute('aria-expanded', 'false');
            triggerElement.setAttribute('aria-haspopup', 'true');
            triggerElement.setAttribute('aria-label', this.label + ' menu');

            buttonCaret = this.ownerDocument.createElement('span');
            buttonCaret.className = 'caret';
            triggerElement.appendChild(buttonCaret);

            this.appendChild(triggerElement);

            return triggerElement;
        },

        _getTriggerElement: function() {
            return this.querySelector('button.ha-button.combo-button-dropdown');
        },

        attachedCallback: function _() {
            _.super(this);

            var actionButton = this.querySelector('.combo-button-action'),
                triggerElement = this._getTriggerElement();

            if (actionButton && triggerElement) {
                buttonClasses.forEach(function(currentClass) {
                    if (this.classList.contains(currentClass)) {
                        actionButton.classList.add(currentClass);
                        triggerElement.classList.add(currentClass);
                    }
                }, this);

                // needed because when spacebar is pressed it goes to this code path
                this.listenTo(actionButton, 'click', function(evt) {
                    utils.stopEvent(evt);
                    this.emit('click');
                }.bind(this));
            }
        }
    });

    return register('ha-combo-button', HAComboButton);
});

define('hui/simple-list',[
        'register-component/v2/register',
        'register-component/v2/UIComponent',
        'object-utils/classes',
        './core/keys',
        './core/utils'
    ], function(register, UIComponent, classes, keys, utils) {

        /**
         * Retrieve the consumer information from the element.
         * @type {HTMLElement}
         * @returns {Array} Array with the items of the element.
         * @private
         */
        var _getConsumerData = function(consumerData) {
                var data = [];

                if (consumerData.childElementCount >= 0) {
                    // We need to remove the nodes since IE will not find the value within the
                    // node if we don't, and that generates a bug.
                    data = utils.removeNodesSafe(consumerData, consumerData.childNodes);
                }

                return data;
            },

            /**
             * Retrieve the index element of given element from their parent element..
             * @param {HTMLElement} el
             * @returns {Number} return the index element.
             * @private
             */
            _getIndexOfElement = function(el) {
                var indexTarget = 0,
                    i = 0,
                    nodes,
                    node;
                if (el && el.parentNode) {
                    nodes = el.parentNode.childNodes;
                    while ((node = nodes.item(i++)) && node !== el) {
                        if (node.nodeType === 1) {
                            indexTarget++;
                        }
                    }
                    return indexTarget;
                }
                return -1;
            },

            LIST_ITEM_HEIGHT = 49,

            HASimpleList = classes.createObject(UIComponent, {

                init: function _() {
                    _.super(this);

                    /**
                     * The last item selected only for single selected list.
                     * by default is null.
                     * @private
                     * @type {HTMLELement}
                     *
                     */
                    this._selectedItem = null;

                    /**
                     * The list of items.
                     * @type {Array}
                     * @private
                     */
                    this._items = [];

                    this.setupProperties({

                        /**
                         * Sets the complexity type of the list: 'basic' or 'complex'. A 'basic' list consists of
                         * a text label and an optional control. A complex list consists of a text label, custom
                         * styling, and any number of custom elements providing information about the item.
                         * Notice this property don't have change handler because is not need change it dynamically.
                         * @type {String}
                         */
                        complexity: {
                            default: 'basic',
                            type: String
                        },

                        /**
                         * The current index item for single selected mode.
                         * @type {Number}
                         */
                        selectedIndex: {
                            default: -1,
                            type: Number,
                            change: function(newValue) {
                                [].forEach.call(this.querySelectorAll('li'), function(el, index) {
                                    if (index === newValue) {
                                        el.classList.add('ha-active');
                                        el.setAttribute('aria-selected', true);
                                        this._selectedItem = el;
                                    } else {
                                        el.classList.remove('ha-active');
                                        el.setAttribute('aria-selected', false);
                                    }
                                }.bind(this));
                                this.emit('select');
                            }
                        },

                        /**
                         * Amount of items to be visible at once. If smaller than length, a scrollbar is shown.
                         * If size property is bigger than 0, adjusts the height of the list.
                         * @type {Number}
                         */
                        size: {
                            type: Number,
                            change: function(newValue) {
                                var list = this.querySelector('ul');
                                if (newValue) {
                                    list.style.maxHeight = (newValue * LIST_ITEM_HEIGHT) + 'px';
                                    list.style.overflowY = 'auto';
                                } else {
                                    list.style.maxHeight = 'none';
                                    list.style.overflowY = 'hidden';
                                }
                            }
                        },

                        /**
                         * The title of the list (optional).
                         * @returns {String}
                         */
                        titleText: {
                            default: '',
                            change: function(newValue, oldValue) {
                                var title = this.querySelector('h2'),
                                    list;

                                if (oldValue !== newValue) {
                                    if (!title) {
                                        list = this.querySelector('ul');
                                        title = this.ownerDocument.createElement('h2');
                                        title.id = 'ha-list-header-' + this.componentId;
                                        title.innerHTML = newValue;
                                        this.insertBefore(title, list);
                                    } else {
                                        title.innerHTML = newValue;
                                    }
                                }
                            }
                        }
                    });

                    this.on('.list-group:keydown', function(evt) {
                        var nextTarget,
                            itemSelected = evt.target;

                        if (evt.keyCode !== keys.TAB) {
                            if (itemSelected && itemSelected.classList.contains('list-group')) {
                                itemSelected.firstChild.focus();
                                return;
                            }

                            while (itemSelected && !itemSelected.classList.contains('list-group-item')) {
                                itemSelected = itemSelected.parentNode;
                            }

                            utils.stopEvent(evt);

                            switch (evt.keyCode) {
                                case keys.UP:
                                    if (itemSelected.previousSibling) {
                                        nextTarget = itemSelected.previousSibling;
                                        nextTarget.focus();
                                        this.selectedIndex = _getIndexOfElement(nextTarget);
                                    } else {
                                        nextTarget = itemSelected.parentNode.lastChild;
                                        nextTarget.focus();
                                        this.selectedIndex = _getIndexOfElement(nextTarget);
                                    }
                                    break;
                                case keys.DOWN:
                                    if (itemSelected.nextSibling) {
                                        nextTarget = itemSelected.nextSibling;
                                        nextTarget.focus();
                                        this.selectedIndex = _getIndexOfElement(nextTarget);
                                    } else {
                                        nextTarget = itemSelected.parentNode.firstChild;
                                        nextTarget.focus();
                                        this.selectedIndex = _getIndexOfElement(nextTarget);
                                    }
                                    break;
                                case keys.ENTER:
                                case keys.SPACEBAR:
                                    this.selectedIndex = _getIndexOfElement(itemSelected);
                                    break;
                            }
                        }

                    }.bind(this));

                    this.on('.list-group-item:click', function(evt) {
                        this.emit('click');
                        utils.stopEvent(evt);
                        var itemSelected = evt.target;
                        while (itemSelected && !itemSelected.classList.contains('list-group-item')) {
                            itemSelected = itemSelected.parentNode;
                        }
                        if (!itemSelected) {
                            return;
                        }
                        this.selectedIndex = _getIndexOfElement(itemSelected);
                    }.bind(this));
                },
                /**
                 * Set a new items on the list.
                 * @param {Array} newValue
                 */
                set items(newValue) {
                    var list = this.querySelector('.list-group'),
                        consumerData,
                        spanEl,
                        control;

                    if (newValue && newValue.length > 0) {
                        // clean older items.
                        list.innerHTML = '';
                        this._items = [];
                        [].forEach.call(newValue, function(item) {
                            item.classList.add('list-group-item');
                            item.tabIndex = -1;
                            consumerData = _getConsumerData(item);
                            consumerData.forEach(function(child) {
                                if (child.data) {
                                    spanEl = this.ownerDocument.createElement('span');
                                    spanEl.innerHTML = child.data;
                                    item.setAttribute('aria-selected', false);
                                    item.appendChild(spanEl);
                                } else {
                                    control = this.ownerDocument.createElement('span');
                                    control.classList.add('control');
                                    control.appendChild(child);
                                    item.appendChild(control);
                                }
                                this._items.push(item);
                            }, this);
                            list.appendChild(item);
                        }.bind(this));
                        if (!this.getAttribute('size')) {
                            this.size = this._items.length;
                        }
                    }
                },

                /**
                 * Retrieve a list of items of the list.
                 * @returns {Array}
                 */
                get items() {
                    return this._items;
                },

                /**
                 *  Read only property
                 */
                set selectedItem(newValue) {
                    // jshint unused:false
                },

                /**
                 * Retrieve the current selected item.
                 * (read only)
                 * @returns {HTMLELement}
                 */
                get selectedItem() {
                    return this._selectedItem;
                },

                postRender: function _() {
                    _.super(this);
                    var isAlreadyRendered = this.querySelector('.list-group-item') !== null,
                        size = this.getAttribute('size'),
                        list,
                        items;

                    if (isAlreadyRendered) {
                        return;
                    }

                    list = this.querySelector('.list-group');
                    if (!list) {
                        list = this.ownerDocument.createElement('ul');
                        list.tabIndex = 0;
                        list.classList.add('list-group');
                        this.appendChild(list);
                    }

                    list.setAttribute('aria-labelledby', 'ha-list-header-' + this.componentId);
                    items = this.querySelectorAll('li') || [];
                    this.items = items;
                    if (!size && items.length > 0) {
                        this.size = items.length;
                    }
                    this.setAttribute('complexity', 'basic'); // This are manual set until will fix V2 Api component default attributes.
                }
            });

        return register('ha-list', HASimpleList);
    }
);


define('text!hui/flyout/flyout.html',[],function () { return '<template>\n  <div class="header-bar">\n    <span class="flyout-tip"></span>\n  </div>\n  <div class="flyout-content-wrapper">\n    <div class="flyout-side-panel-wrapper"></div>\n    <section class="flyout-content">\n    </section>\n  </div>\n</template>';});


define('hui/flyout',[
    'register-component/v2/register',
    'object-utils/classes',
    './core/contentNode',
    './core/popup',
    './core/utils',
    './core/a11y',
    './core/keys',
    './core/Viewport',
    'register-component/template!./flyout/flyout.html',
    'register-component/v2/UIComponent'
], function(register, classes, contentNode, popup, Utils, a11y, keys, Viewport, template, UIComponent) {
    'use strict';

    /**
     * Handler onanimationend.
     * @param {AnimationEvent} ev
     * @emits HA-FLYOUT#show
     * @emits HA-FLYOUT#close
     */
    function _animationListenerEnd(ev) {
        var eventName = ev.animationName,
            target = ev.target;

        if (eventName === 'ha-fade-in') {
            target.classList.remove('enter');
            target.emit('show');
        } else if (eventName === 'ha-fade-out') {
            target.classList.remove('visible');
            target.classList.remove('leave');
            target.emit('close');
        }
    }

    /**
     * Sets the flyout and the tip final positions.
     * @param {Event} ev
     */
    function _adjustFinalPosition(ev) {
        var target = ev.target,
            tip = target.querySelector('.flyout-tip'),
            button = _getButton(target);

        if (ev.animationName === 'ha-fade-in' || ev.type === 'more' || ev.type === 'less') {
            //separates the component from the button
            target.style.top = parseInt(target.style.top, 10) + 7 + 'px';
            //sets the tip position under the button
            tip.style.left = button.offsetLeft - target.offsetLeft + button.offsetWidth / 2 - tip.offsetWidth / 2 + 'px';
        }
    }

    /**
     * Blur Handler.
     * @param {Event} ev Blur event.
     */
    function _onBlur(ev) {
        // Stores the ha-flyout that has triggered the blur event
        var component = Utils.getComponentFromElement(ev.target, 'HA-FLYOUT');

        if (component.tagName === 'HA-FLYOUT') {
            Utils.stopEvent(ev);
        }

        if (!component.contains(Utils.getSafeTargetFromEvent(ev)) || !component.contains(document.activeElement) || document.activeElement === ev.target) {
            component.close();
        }
    }

    /**
     * Returns the button that toggles the flyout.
     * @param {Component} component Flyout instance (this).
     * @returns {HTMLElement} The flyout button.
     * @private
     */
    function _getButton(component) {
        var button;

        if (component.targetSelector !== '_previousSibling') {
            button = component.querySelector(component.targetSelector);
        } else {
            button = component.previousElementSibling;
        }

        return button;
    }

    /**
     * Sets the animationend event handler for animating the popup hide
     * @param {Event} ev click event.
     * @emits HA-Flyou#more / HA-Flyou#less
     * @private
     */
    function _toggleMoreLess(ev) {
        var flyout = Utils.getComponentFromElement(ev.target, 'HA-FLYOUT'),
            flyoutMore = flyout.querySelector('.flyout-more'),
            flyoutLess = flyout.querySelector('.flyout-less'),
            toggleMore = flyout.querySelector('.show-more'),
            eventType;
        if (ev.type === 'click' || ev.keyCode === keys.ENTER) {
            ev.preventDefault();
            if (flyoutMore.classList.contains('hidden')) {
                flyoutLess.classList.add('hidden');
                flyoutMore.classList.remove('hidden');
                toggleMore.classList.add('show-less');
                toggleMore.querySelector('span').innerHTML = flyout.lessText;
                eventType = 'more';
            } else {
                flyoutMore.classList.add('hidden');
                flyoutLess.classList.remove('hidden');
                toggleMore.classList.remove('show-less');
                toggleMore.querySelector('span').innerHTML = flyout.moreText;
                eventType = 'less';
            }

            //calls popup setPosition method for updating the flyout position
            popup.setPosition(flyout, _getButton(flyout), POSITION, ALIGNMENT);
            flyout.emit(eventType, {target: flyout});
            a11y.setFocusOnAnyFirst(flyout.querySelector('.flyout-content'));
        }
    }

    /**
     * Toggles Flyout display
     * @param {HTMLElement} flyout to show/hide.
     * @param {Event} event The event that triggered the flyout toggling
     */
    function _toggleFlyout(flyout, event) {
        if (flyout.classList.contains('visible')) {
            flyout.close();
        } else {
            flyout.show(event);
        }
    }

    /**
     * Recalculates the position when resizing viewport or expanding flyout
     * @param {HTMLElement} flyout to show/hide.
     */
    function _recalculatePosition(flyout) {
        popup.setPosition(flyout, _getButton(flyout), POSITION, ALIGNMENT);
        _adjustFinalPosition({target: flyout, animationName: 'ha-fade-in'});

    }

    /**
     * Calculates the width of the wider column, and sets that value as the width of the rest of them
     * @param  {HTMLElement} component The Flyout component
     */
    function _updateColumnsWidth(component) {
        var items = component.querySelectorAll('ha-menu-item, th'),
            sidePanelColumn = component.querySelector('.flyout-side-panel td'),
            contentColumns = component.querySelectorAll('.flyout-content td'),
            columnsNumber = contentColumns.length,
            itemsNumber = items.length,
            longestStringLength = 0,
            canvas = document.createElement('canvas'),
            itemStyle, index,
            itemText, menuStyle, font, itemLength;

        //get the styles from the first item (we assume all items have the same font styling)
        itemStyle = getComputedStyle(items[0]);
        font = itemStyle.fontSize + ' ' + itemStyle.fontFamily;

        //First find the longest string in the menu items
        for (index = 0; index < itemsNumber; index++) {
            itemText = items[index].innerHTML;
            itemLength = Utils.getTextWidth(itemText, font, canvas);
            if (itemLength > longestStringLength) {
                longestStringLength = itemLength;
            }
        }

        menuStyle = getComputedStyle(items[0].parentElement);

        //set the calculated maximum width to every white column, the cells will adjust automatically
        for (index = 0; index < columnsNumber; index++) {
            contentColumns[index].style.width = longestStringLength + CONTENT_COLUMNS_EXTRA_WIDTH + 'px';
        }

        //set the width to the blue panel column if present
        if (sidePanelColumn) {
            sidePanelColumn.style.width = longestStringLength + SIDE_PANEL_COLUMN_EXTRA_WIDTH + 'px';
        }
    }

    var POSITION = ['bottom'],
        ALIGNMENT = ['center'],
        SIDE_PANEL_COLUMN_EXTRA_WIDTH = 59,
        CONTENT_COLUMNS_EXTRA_WIDTH = 40,

        /**
         * Map that says where to insert the content that the consumer sends on the initialization.
         * @type {Object}
         */
        contentPropertyMap = {
            'section': 'section'
        },

        triggerEventType,

        HAFlyout = classes.createObject(UIComponent, {

            init: function _() {

                _.super(this);

                /**
                * Component template
                * @type {function}
                */
                this.template = template;

                contentNode.cacheInputContent(this, contentPropertyMap);

                this.setupProperties({
                    /**
                     * Flyout Header Title
                     * @type {String}
                     */
                    titleText: {
                        default: '',
                        change: function(newValue) {
                            var title = this.querySelector('h3'),
                                content = this.querySelector('.flyout-content');

                            if (!title) {
                                title = this.ownerDocument.createElement('h3');
                                title.innerHTML = newValue;
                                content.insertBefore(title, content.firstElementChild);
                            } else {
                                title.innerHTML = newValue;
                            }

                            title.id = 'flyout-title-' + this.componentId;
                        }
                    },

                    moreText: {
                        default: 'More',
                        change: function(newValue) {
                            var spanText,
                                toggleMore = this.querySelector('.show-more');
                            if (toggleMore && !toggleMore.classList.contains('show-less')) {
                                spanText = toggleMore.querySelector('span');
                                spanText.innerHTML = newValue;
                            }
                        }
                    },

                    lessText: {
                        default: 'Less',
                        change: function(newValue) {
                            var spanText,
                                toggleMore = this.querySelector('.show-more');
                            if (toggleMore && toggleMore.classList.contains('show-less')) {
                                spanText = toggleMore.querySelector('span');
                                spanText.innerHTML = newValue;
                            }
                        }
                    },

                    targetSelector: {
                        default: '_previousSibling'
                    }
                });
            },

            set section(newValue) {
                var flyoutContent = this.querySelector('.flyout-content'),
                    content = flyoutContent.children,
                    title = this.querySelector('h3');
                if (content.length > 0) {
                    Utils.removeNodesSafe(flyoutContent, content);
                }

                if (title) {
                    flyoutContent.appendChild(title);
                }

                if (Array.isArray(newValue)) {
                    newValue.forEach(function(node) {
                        flyoutContent.appendChild(node);
                    });
                } else {
                    flyoutContent.appendChild(newValue);
                }
            },

            get section() {
                return this.querySelector('.flyout-content');
            },

            /**
            * Attaches the click event handler to the flyout button.
            */
            attachedCallback: function _() {
                var button = _getButton(this),
                    leftPanel = this.querySelector('.flyout-side-panel'),
                    panelPlace = this.querySelector('.flyout-side-panel-wrapper'),
                    flyoutMore = this.querySelector('.flyout-more'),
                    content = this.querySelector('.flyout-content'),
                    menu = this.querySelector('ha-menu'),
                    arrowMore, spanText, toggleMore;

                if (button && button.tagName === 'BUTTON') {
                    this.listenTo(button, 'click', function(evt) {
                        evt.preventDefault();
                        _toggleFlyout(this, evt);
                    }.bind(this));
                    this.listenTo(button, 'keypress', function(evt) {
                        if (evt.keyCode === keys.ENTER) {
                            evt.preventDefault();
                            _toggleFlyout(this, evt);
                        }
                    }.bind(this));
                } else {
                    console.warn('Flyout must have at least a button as previous sibling');
                }

                if (leftPanel) {
                    this.classList.add('ha-flyout-side-panel');
                    Utils.removeNodesSafe(this, leftPanel);
                    panelPlace.appendChild(leftPanel);
                    _updateColumnsWidth(this);
                }

                if (flyoutMore) {
                    content.classList.add('clearfix');
                    flyoutMore.classList.add('hidden');
                    //Creates "Show More" link
                    toggleMore = this.querySelector('button.show-more');
                    if (!toggleMore) {
                        toggleMore = this.ownerDocument.createElement('button');
                        toggleMore.tabIndex = 0;
                        toggleMore.classList.add('show-more');

                        arrowMore = this.ownerDocument.createElement('i');
                        arrowMore.className = 'show-more-arrow';
                        toggleMore.appendChild(arrowMore);

                        spanText = this.ownerDocument.createElement('span');
                        spanText.innerHTML = this.moreText;
                        toggleMore.appendChild(spanText);

                        content.appendChild(toggleMore);
                    }

                    this.on('.show-more:click', _toggleMoreLess);
                    this.on('.show-more:keypress', _toggleMoreLess);
                    _updateColumnsWidth(flyoutMore);
                }

                if (content.children.length > 1 && !leftPanel && !flyoutMore && !menu) {
                    this.classList.add('flyout-non-menu');
                    content.tabIndex = -1;
                }

                //sets the aria-labelledby attribute to make the screen reader announce the
                //title when focus is given to the component.
                this.setAttribute('aria-labelledby', 'flyout-title-' + this.componentId);

            },

            /**
             * Shows the flyout using popup
             * @param {Event} event The event that triggered the flyout opening
             */
            show: function(event) {
                var button = _getButton(this),
                    menus = this.querySelectorAll('ha-menu');

                //makes the menus tabable.
                if (menus.length && menus[0].tabIndex === -1) {
                    [].forEach.call(menus, function(item) {
                        item.tabIndex = 0;
                    });
                }

                if (popup.setPosition(this, button, POSITION, ALIGNMENT)) {
                    this.classList.remove('leave');
                    this.classList.add('enter');
                    this.classList.add('visible');
                }

                if (event) {
                    triggerEventType = event.type;
                } else {
                    triggerEventType = null;
                }

                this._resizeMethod = function() {
                    _recalculatePosition(this);
                }.bind(this);

                Viewport.onResize(this._resizeMethod);

                this.focus();
            },

            /**
             * Hides Flyout
             */
            close: function() {
                this.classList.add('leave');
                _getButton(this).focus();
            },

            preRender: function _() {
                _.super(this);
            },

            /**
             * Sets event handlers for animations and user interaction events.
             */
            createdCallback: function _() {
                var animationEndEvt = 'webkitAnimationName' in this.ownerDocument.documentElement.style ? 'webkitAnimationEnd' : 'animationend',
                    animationStartEvt = 'webkitAnimationName' in this.ownerDocument.documentElement.style ? 'webkitAnimationStart' : 'animationstart';

                _.super(this);

                // This timeout it's a fix for firefox. Without it, there is no way to tell
                // where the focus is going and we can't be sure we can close the flyout
                this.listenTo(this, 'blur', function(evt) {
                    setTimeout(function() {
                        _onBlur(evt);
                    }, 1);
                }, true);
                this.on(animationStartEvt, _adjustFinalPosition);
                this.on('more', _adjustFinalPosition);
                this.on('less', _adjustFinalPosition);
                this.on(animationEndEvt, _animationListenerEnd);
                this.on('close', function() {
                    popup.uninstallResizeMethod(this._resizeMethod);
                });

                //Keyboard access event handlers
                this.on('keydown', function(evt) {
                    if (keys.ESCAPE === evt.keyCode) {
                        Utils.stopEvent(evt);
                        this.close();
                    }
                });
            },

            postRender: function _() {
                _.super(this);
                contentNode.storeCachedInput(this, contentPropertyMap);
                this.tabIndex = -1;
            }

        });

    return register('ha-flyout', HAFlyout);
});


define('text!hui/money-bar/money-bar.html',[],function () { return '<template>\n    <div class="segments">\n    </div>\n</template>';});



define('text!hui/money-bar-cell/money-bar-cell.html',[],function () { return '<template>\n    <div class="money-bar-block"></div>\n    <div class="money-bar-text">\n    \t<span class="primary-text">{{primaryText}}</span>\n    \t<span class="secondary-text">{{secondaryText}}</span>\n    \t<span class="close-icon" tabindex="-1" aria-label="Close" role="button"> &#xf061;</span>\n    </div>\n</template>';});


define('hui/money-bar-cell',[
    'register-component/v2/UIComponent',
    'register-component/v2/register',
    'register-component/template!./money-bar-cell/money-bar-cell.html',
    './core/keys',
    'object-utils/classes'
],
    function(UIComponent, register, template, keys, classes) {
        var HAMoneyBarCell = classes.createObject(UIComponent, {
            init: function _() {

                _.super(this);
                this.template = template;
                this.mbcells = null;

                this.setupProperties({
                    /**
                     * primary text associated with mb cell
                     * used for numbers in classic mb
                     * @type {String}
                     */
                    primaryText: {
                        default: '',
                        change: function(newValue) {
                            var pTextEl = this.querySelector('.primary-text'),
                                mbTextEl = this.querySelector('.money-bar-text'),
                                mbTextChild = mbTextEl.firstChild; //where it should be appended

                            if (newValue) {
                                if (!pTextEl) {
                                    pTextEl = document.createElement('span');
                                    pTextEl.classList.add('primary-text');
                                    mbTextEl.insertBefore(pTextEl, mbTextChild);
                                }
                                pTextEl.textContent = newValue;
                                this._nodes.primaryText = pTextEl;
                            }
                        }
                    },
                    /**
                     * secondary text associated with mb cell
                     * used for description in classic mb
                     * @type {String}
                     */
                    secondaryText: {
                        default: '',
                        change: function(newValue) {
                            var sTextEl = this.querySelector('.secondary-text'),
                                mbTextEl = this.querySelector('.money-bar-text'),
                                mbTextChild = mbTextEl.querySelector('.close-icon'); //where it should be appended before
                            if (newValue) {
                                if (!sTextEl) {
                                    sTextEl = document.createElement('span');
                                    sTextEl.classList.add('secondary-text');
                                    mbTextEl.insertBefore(sTextEl, mbTextChild);
                                }
                                sTextEl.textContent = newValue;
                                this._nodes.secondaryText = sTextEl;
                            }
                        }
                    },
                    /**
                     * state of the mb, adds/removes click class to mb
                     * @type {String}
                     */
                    state: {
                        default: 'deselected',
                        change: function(newValue) {
                            var block = this._nodes.mbBlock,
                                closeIcon = this.querySelector('.close-icon');

                            if (this.state !== block.state) {
                                if (newValue === 'deselected') {
                                    block.state = newValue;
                                    this.classList.remove('click');
                                    closeIcon.setAttribute('tabindex', '-1');
                                    this.emit('deselected', {target: this});
                                } else if (newValue === 'selected') {
                                    block.state = newValue;
                                    this.classList.add('click');
                                    closeIcon.setAttribute('tabindex', '0');
                                    this.emit('selected', {target: this});
                                } else {
                                    //if illegal value is passed
                                    //keep it to whatever value it was originally
                                    this.state = block.state;
                                }
                            }
                        }
                    }
                });
                /* bind event handlers */
                this.listenTo(this, 'mouseenter', function(evt) {
                    this._eventAddClass('hover', 'inlay-hover', evt);
                }.bind(this));

                this.listenTo(this, 'mouseleave', function(evt) {
                    this._eventRemoveClass('hover', 'inlay-hover', evt);
                }.bind(this));

                this.listenTo(this, 'focusin', function(evt) {
                    this._eventAddClass('hover', 'inlay-hover', evt);
                }.bind(this));

                this.listenTo(this, 'focus', function(evt) {
                    this._eventAddClass('hover', 'inlay-hover', evt);
                }.bind(this));

                this.listenTo(this, 'focusout', function(evt) {
                    this._eventRemoveClass('hover', 'inlay-hover', evt);
                    this.setAttribute('tabindex', '-1');
                }.bind(this));

                this.listenTo(this, 'blur', function(evt) {
                    this._eventRemoveClass('hover', 'inlay-hover', evt);
                    this.setAttribute('tabindex', '-1');
                }.bind(this));

                this.listenTo(this, 'click', function(evt) {
                    evt.preventDefault();
                    evt.stopPropagation();
                    if (this.state === 'selected') {
                        this.state = 'deselected';
                        this.classList.remove('inlay-select');
                        this._eventRemoveClass('click', 'inlay-select', evt);
                        this._eventRemoveClass('hover', 'inlay-hover', evt);
                        this.setAttribute('tabindex', '-1');
                        this.blur();
                    } else {
                        this.state = 'selected';
                        this.setAttribute('tabindex', '0');
                        this.focus();
                        this._eventAddClass('click', 'inlay-select', evt);
                    }
                }.bind(this));

                this.listenTo(this, '.close-icon:keydown', function(evt) {
                    if (evt.keyCode === keys.ENTER) {
                        var sibling = this.nextElementSibling;
                        this.state = 'deselected';
                        //behaviors for outlay/inlay
                        if (this.classList.contains('outlay')) {
                            if (sibling !== null && sibling.classList.contains('inlay')) {
                                sibling.classList.remove('inlay-select');
                            }
                        }
                        evt.stopPropagation();
                        this.style.outline = '1px dotted #212121';
                        this.style.outline = '-webkit-focus-ring-color auto 5px';
                        this.focus();
                    } else if (evt.keyCode === keys.TAB) {
                        evt.stopPropagation();
                        evt.preventDefault();
                        this.style.outline = '1px dotted #212121';
                        this.style.outline = '-webkit-focus-ring-color auto 5px';
                        this.focus();
                    }
                }.bind(this));
            },
            /*
             * Creates a Money Bar Cell based on the attributes that were passed.
             */
            postRender: function _() {
                var primaryTextEl = this.querySelector('.primary-text'),
                    secondaryTextEl = this.querySelector('.secondary-text'),
                    mbBlockEl = this.querySelector('.money-bar-block');

                //_nodes maintains synchronicity and makes sure properties are legal
                //by keeping track of the previous state of properties when they are changed
                this._nodes = {};
                this._nodes.mbBlock = mbBlockEl;

                this._nodes.primaryText = primaryTextEl;
                this._nodes.secondaryText = secondaryTextEl;

                //accessibility
                this.setAttribute('tabindex', '-1');
                this.setAttribute('role', 'menuitem');
                this.setAttribute('id', 'ha-money-bar-cell-' + this.componentId);
            },
            _eventAddClass: function _(thisClass, inlayClass, evt) {
                this.classList.add(thisClass);
                var sibling = this.nextElementSibling;
                //behaviors for outlay/inlay
                if (this.classList.contains('outlay')) {
                    if (sibling !== null && sibling.classList.contains('inlay')) {
                        sibling.classList.add(inlayClass);
                    }
                }
                evt.stopPropagation();
            },
            _eventRemoveClass: function _(thisClass, inlayClass, evt) {
                this.classList.remove(thisClass);
                var sibling = this.nextElementSibling;
                //behaviors for outlay/inlay
                if (this.classList.contains('outlay')) {
                    if (sibling !== null && sibling.classList.contains('inlay')) {
                        sibling.classList.remove(inlayClass);
                    }
                }
                evt.stopPropagation();
            }

        });
        return register('ha-money-bar-cell', HAMoneyBarCell);
    });

define('text!hui/money-bar-segment/money-bar-segment.html',[],function () { return '<template>\n\t<h4 class="segment-header">\n\t\t<span class="segment-text-bold">{{titleTextBold}}</span>\n\t\t<span class="segment-text">{{titleText}}</span>\n\t</h4>\n    <div class="cells">\n    </div>\n</template>';});


define('hui/money-bar-segment',[
    'register-component/v2/UIComponent',
    'register-component/v2/register',
    'register-component/template!./money-bar-segment/money-bar-segment.html',
    './core/utils',
    'object-utils/classes'
],
    function(UIComponent, register, template, utils, classes) {
        var HAMoneyBarSegment = classes.createObject(UIComponent, {
            init: function _() {
                _.super(this);
                this.template = template;
                this._cells = null;

                /*
                 * ES5 setter that updates this._cells property
                 * and makes sure that DOM nodes are current
                 */
                Object.defineProperty(this, 'cells', {
                    set: function(newCells) {
                        var cellContainer = this.querySelector('.cells'),
                            headerEl = this.querySelector('.segment-header');
                        //if we have initialized the cell container, update the dom
                        if (cellContainer) {
                            cellContainer.innerHTML = '';
                            newCells.forEach(function(element) {
                                element.setAttribute('aria-describedby', headerEl.id);
                                cellContainer.appendChild(element);
                            });
                        }
                        this._cells = newCells;
                    }
                });
                this.setupProperties({
                    /**
                     * part of text associated with mb segment
                     * used for numbers in classic mb
                     * @type {String}
                     */
                    titleTextBold: {
                        default: '',
                        change: function(newValue) {
                            var textEl = this.querySelector('.segment-text-bold'),
                                headerEl = this.querySelector('.segment-header'),
                                theFirstChild = headerEl.firstChild;

                            if (newValue) {
                                if (!textEl) {
                                    textEl = document.createElement('span');
                                    textEl.classList.add('segment-text-bold');
                                    headerEl.insertBefore(textEl, theFirstChild);
                                }
                                textEl.textContent = newValue;
                                this._nodes.titleTextBold = textEl;
                            }
                        }
                    },
                    /**
                     * part of text associated with mb segment
                     * used for description in classic mb
                     * @type {String}
                     */
                    titleText: {
                        default: '',
                        change: function(newValue) {
                            var textEl = this.querySelector('.segment-text'),
                                headerEl = this.querySelector('.segment-header'),
                                theFirstChild = headerEl.firstChild;

                            if (newValue) {
                                if (!textEl) {
                                    textEl = document.createElement('span');
                                    textEl.classList.add('segment-text');
                                    headerEl.insertBefore(textEl, theFirstChild);
                                }
                                textEl.textContent = newValue;
                                this._nodes.titleText = textEl;
                            }
                        }
                    },
                    /**
                     * number of interior cells, used to set "flex" style of segment
                     * @type {String}
                     */
                    size: {
                        default: '2',
                        change: function(newValue) {
                            var cellContainer = this._nodes.cellContainer;
                            if (this.size !== cellContainer.size) {
                                cellContainer.size = newValue;
                                this.style.flex = (newValue + ' 0 0px');
                                //for safari
                                this.style['-webkit-flex'] = (newValue + ' 0 0px');
                            }
                        }
                    }
                });
            },

            /*
             * Sets up Cells for the creation of the Money Bar
             * Transform list of Cells from NodeList to array
             */
            preRender: function _() {
                var mbcells,
                    mbcellContainerEl = this.querySelector('.cells');
                // assign cells from ha-money-bar-cells nodes
                mbcells = this.querySelectorAll('ha-money-bar-cell');
                if (mbcellContainerEl) {
                    // but if we have rendered it already, don't attempt to remove the node
                    // make it an array
                    this.cells = Array.prototype.map.call(mbcells, function(element) {
                        return element;
                    });
                } else {
                    this.cells = utils.removeNodesSafe(this, mbcells);
                }
            },

            /*
             * Creates a Money Bar Segment based on the attributes that were passed.
             */
            postRender: function _() {
                _.super(this);

                var mbcellContainerEl = this.querySelector('.cells'),
                    headerEl = this.querySelector('.segment-header'),
                    titleEl = this.querySelector('.segment-text'),
                    titleBoldEl = this.querySelector('.segment-text-bold');

                //_nodes maintains synchronicity and makes sure properties are legal
                //by keeping track of the previous state of properties when they are changed
                this._nodes = {};
                this._nodes.cellContainer = mbcellContainerEl;
                mbcellContainerEl.innerHTML = ''; //make sure it's empty
                headerEl.setAttribute('id', ('segment-header-' + this.componentId));
                this._nodes.titleText = titleEl;
                this._nodes.titleTextBold = titleBoldEl;
                this._cells.forEach(function(element) {
                    element.setAttribute('aria-describedby', headerEl.id);
                    mbcellContainerEl.appendChild(element);
                });
                //so that the money bar actually displays correctly
                this.style.flex = (this.size + ' 0 0px');
                //for safari
                this.style['-webkit-flex'] = (this.size + ' 0 0px');
                this.id = ('ha-money-bar-segment-' + this.componentId);

            }
        });
        return register('ha-money-bar-segment', HAMoneyBarSegment);
    });
define('hui/money-bar',[
    'register-component/v2/UIComponent',
    'register-component/v2/register',
    'register-component/template!./money-bar/money-bar.html',
    './core/utils',
    './core/keys',
    'object-utils/classes',
    './money-bar-cell',
    './money-bar-segment'
],
    function(UIComponent, register, template, utils, keys, classes) {

        var HAMoneyBar = classes.createObject(UIComponent, {
            init: function _() {
                _.super(this);
                this.template = template;
                this._segments = null;

                /*
                 * ES5 setter that updates this._segments property
                 * and makes sure that DOM nodes are current
                 */
                Object.defineProperty(this, 'segments', {
                    set: function(newSegs) {
                        var segContainer = this.querySelector('.segments');
                        //if we have initialized the segment container, update the dom
                        if (segContainer) {
                            segContainer.innerHTML = '';
                            newSegs.forEach(function(element) {
                                segContainer.appendChild(element);
                            });
                        }
                        this._segments = newSegs;
                    }
                });

                /* bind event handlers */
                this.listenTo(this, 'ha-money-bar-cell:selected', function(evt) {
                    //a cell has been selected, so we want to clear all other selected cells
                    this.clearSelectedExcept(evt.target);
                }.bind(this));

                this.listenTo(this, 'keydown', function(evt) {
                    var nextTarget,
                        itemSelected = evt.target,
                        selectedIndex,
                        cells = this.querySelectorAll('ha-money-bar-cell'),
                        sibling = evt.target.nextElementSibling;
                    //if the target is a cell
                    if (evt.target.nodeName === 'HA-MONEY-BAR-CELL') {
                        evt.stopPropagation();
                        evt.preventDefault();
                        //move up or left on the money bar
                        if ((evt.keyCode === keys.UP) || (evt.keyCode === keys.LEFT)) {
                            //if not first cell in the Money Bar
                            if (itemSelected.id !== cells[0].id) {
                                selectedIndex = 0;
                                //find next target
                                while (cells[selectedIndex].id !== itemSelected.id) {
                                    selectedIndex++;
                                }
                                nextTarget = cells[(selectedIndex - 1)];
                                itemSelected.setAttribute('tabindex', '-1');
                                itemSelected.style.outline = 'none';
                                itemSelected.blur();
                                nextTarget.setAttribute('tabindex', '0');
                                //add a specific focus outline (necessary for FF)
                                //or override that focus outline and use the browser default, if present
                                nextTarget.style.outline = '1px dotted #212121';
                                nextTarget.style.outline = '-webkit-focus-ring-color auto 5px';
                                nextTarget.focus();
                                if (itemSelected.state === 'selected') {
                                    (itemSelected.querySelector('.close-icon')).setAttribute('tabindex', '-1');
                                }
                                if (nextTarget.state === 'selected') {
                                    (nextTarget.querySelector('.close-icon')).setAttribute('tabindex', '0');
                                }
                            }
                        //move down or right on the money bar
                        } else if ((evt.keyCode === keys.DOWN) || (evt.keyCode === keys.RIGHT)) {
                            //if not last cell in the Money Bar
                            if (itemSelected.id !== cells[cells.length - 1].id) {
                                selectedIndex = cells.length - 1;
                                //find next target
                                while (cells[selectedIndex].id !== itemSelected.id) {
                                    selectedIndex--;
                                }
                                nextTarget = cells[(selectedIndex + 1)];
                                //reset itemSelected to unselected state
                                itemSelected.style.outline = 'none';
                                itemSelected.setAttribute('tabindex', '-1');
                                itemSelected.blur();
                                //select new cell
                                nextTarget.setAttribute('tabindex', '0');
                                //add a specific focus outline (necessary for FF)
                                //or override that focus outline and use the browser default, if present
                                nextTarget.style.outline = '1px dotted #212121';
                                nextTarget.style.outline = '-webkit-focus-ring-color auto 5px';
                                nextTarget.focus();
                                if (itemSelected.state === 'selected') {
                                    (itemSelected.querySelector('.close-icon')).setAttribute('tabindex', '-1');
                                }
                                if (nextTarget.state === 'selected') {
                                    (nextTarget.querySelector('.close-icon')).setAttribute('tabindex', '0');
                                }
                            }
                        } else if (evt.keyCode === keys.ENTER) {
                            //select or deselect the cell, based on its state
                            if (itemSelected.state === 'deselected') {
                                //select a new cell
                                itemSelected.state = 'selected';
                                //behaviors for outlay/inlay
                                if (itemSelected.classList.contains('outlay')) {
                                    if (sibling !== null && sibling.classList.contains('inlay')) {
                                        sibling.classList.add('inlay-select');
                                    }
                                }
                            } else {
                                //deselect the cell
                                itemSelected.state = 'deselected';
                                //behaviors for outlay/inlay
                                if (itemSelected.classList.contains('outlay')) {
                                    if (sibling !== null && sibling.classList.contains('inlay')) {
                                        sibling.classList.remove('inlay-select');
                                    }
                                }
                            }
                        //if we tab, blur focus on the cell
                        } else if (evt.keyCode === keys.TAB) {
                            if (itemSelected.state === 'deselected') {
                                itemSelected.setAttribute('tabindex', '-1');
                                itemSelected.style.outline = 'none';
                                itemSelected.blur();
                                this.focus();
                            } else {
                                itemSelected.style.outline = 'none';
                                (itemSelected.querySelector('.close-icon')).focus();
                            }
                        }
                    // else if the target is the money bar itself
                    } else if (evt.target.nodeName === 'HA-MONEY-BAR') {
                        //start moving through the money bar by focusing on the first cell
                        if ((evt.keyCode === keys.DOWN) || (evt.keyCode === keys.RIGHT)) {
                            cells[0].setAttribute('tabindex', '0');
                            //add a specific focus outline (necessary for FF)
                            //or override that focus outline and use the browser default, if present
                            cells[0].style.outline = '1px dotted #212121';
                            cells[0].style.outline = '-webkit-focus-ring-color auto 5px';
                            cells[0].focus();
                            evt.stopPropagation();
                            evt.preventDefault();
                        }
                    }
                }.bind(this));
            },

            /*
             * Sets up Segments for the creation of the Money Bar
             * Transform list of segments from NodeList to array
             */
            preRender: function _() {
                var mbsegs,
                    mbsegContainerEl = this.querySelector('.segments');

                // assign cells from ha-money-bar-cells nodes
                if (!this._segments) {
                    mbsegs = this.querySelectorAll('ha-money-bar-segment'); //returns NodeList
                    if (mbsegContainerEl) {
                        // but if we have rendered it already, don't attempt to remove the node
                        // make it an array
                        this.segments = Array.prototype.map.call(mbsegs, function(element) {
                            return element;
                        });
                    } else {
                        this.segments = utils.removeNodesSafe(this, mbsegs);
                    }
                }
            },

            /*
             * Creates a Money Bar based on the attributes that were passed.
             */
            postRender: function _() {
                var mbsegContainerEl = this.querySelector('.segments');

                this._nodes = {};
                this._nodes.segContainer = mbsegContainerEl;
                mbsegContainerEl.innerHTML = ''; //make sure it's empty
                this._segments.forEach(function(element) {
                    mbsegContainerEl.appendChild(element);
                });

                this.setAttribute('role', 'menubar');
                this.setAttribute('tabindex', '0');
            },

            /*
             * Public method which deselects all the cells in a Money Bar
             */
            clearSelected: function _() {
                var mbcells = this.querySelectorAll('ha-money-bar-cell'),
                    i = 0;
                for (i; i < mbcells.length; i++) {
                    mbcells[i].setAttribute('state', 'deselected');
                    mbcells[i].classList.remove('inlay-select');
                }
            },

            /*
             * deselects all cells in all segments except for @segment
             */
            clearSelectedExcept: function _(component) {
                var notOutlay = true,
                    mbcells,
                    i = 0;
                //if the selected component is an outlay, we don't want to
                //remove inlay-select from the inlay
                //without this, there are synchronicity issues in all browsers
                //except for Chrome
                if (component.classList.contains('outlay')) {
                    notOutlay = false;
                }
                mbcells = this.querySelectorAll('ha-money-bar-cell');
                for (i; i < mbcells.length; i++) {
                    if (mbcells[i].id !== component.id) {
                        mbcells[i].setAttribute('state', 'deselected');
                        if (notOutlay) {
                            mbcells[i].classList.remove('inlay-select');
                        }
                    }
                }
            },
            /*
             * Public method which selects one cell in a Money Bar
             * only one cell selectable at a time
             */
            setSelected: function _(component) {
                this.clearSelected();
                component.setAttribute('state', 'selected');
            }
        });
        return register('ha-money-bar', HAMoneyBar);
    });
define('hui/stage',[
        'register-component/v2/register',
        'register-component/v2/UIComponent',
        'object-utils/classes',
        './core/contentNode'
    ],
    function(register, UIComponent, classes, contentNode) {
        'use strict';
        /**
         * This method is used to toggle the visiblity of the Stage
         */
        function _toggle() {
            /*jshint validthis:true */
            if (this.open) {
                this.close();
            } else {
                this.show();
            }
        }

        /**
         * Updates collapsible's toggle button aria-controls attribute
         * @param  {HTMLElement} stage
         */
        function _updateAriaControls(stage) {
            var section = stage.querySelector('section'),
                buttonToggle = stage.querySelector('.btn-toggle'),
                sectionId;

            if (section && stage.collapsible) {
                sectionId = section.id;
                if (!sectionId) {
                    section.id = 'stage-section-' + stage.componentId;
                    sectionId = section.id;
                }
                if (buttonToggle) {
                    buttonToggle.setAttribute('aria-controls', sectionId);
                }
            }
        }

        var _contentPropertyMap = {
            'header': 'header',
            'section': 'section'
        },

        HAStage = classes.createObject(UIComponent, {

            init: function _() {
                _.super(this);
                // header init null
                this._header = null;
                // section init null
                this._section = null;

                contentNode.cacheInputContent(this, _contentPropertyMap);

                this.setupProperties({
                    /**
                     * Collapsible indicates if the Stage is collapsible.
                     * @type {Boolean}
                    */
                    collapsible: {
                        default: false,
                        type: Boolean,
                        change: function(newValue) {
                            var header = this.querySelector('header'),
                                section = this.querySelector('section'),
                                buttonToggle = this.querySelector('.btn-toggle'),
                                iconToggle;
                            if (newValue) {
                                if (!section || !header) {
                                    console.error('You can not set collapsible to be true if you do not have both a header and a section.');
                                } else {
                                    if (!buttonToggle) {
                                        buttonToggle = this.ownerDocument.createElement('button');
                                        buttonToggle.className = 'btn-toggle';
                                        buttonToggle.setAttribute('aria-expanded', 'false');
                                        buttonToggle.setAttribute('aria-label', 'expand');
                                        this.appendChild(buttonToggle);
                                        iconToggle = this.ownerDocument.createElement('i');
                                        iconToggle.className = 'hi hi-chevron-down';
                                        buttonToggle.appendChild(iconToggle);
                                    }
                                    section.classList.remove('inner-visible');
                                    _updateAriaControls(this);
                                }
                            } else {
                                if (buttonToggle) {
                                    this.removeChild(buttonToggle);
                                }
                                if (section) {
                                    section.classList.add('inner-visible');
                                }
                            }
                        }
                    },

                    /**
                     * Open indicates if the Stage content is open.
                     * @type {Boolean}
                    */
                    open: {
                        default: false,
                        type: Boolean,
                        change: function(newValue) {
                            var iconToggle,
                                buttonToggle = this.querySelector('.btn-toggle'),
                                section = this.querySelector('section');
                            if (this.collapsible && section) {
                                iconToggle = buttonToggle.querySelector('.hi');
                                if (newValue) {
                                    buttonToggle.setAttribute('aria-expanded', 'true');
                                    buttonToggle.setAttribute('aria-label', 'collapse');
                                    iconToggle.classList.add('hi-chevron-up');
                                    iconToggle.classList.remove('hi-chevron-down');
                                    section.classList.add('inner-visible');
                                } else {
                                    buttonToggle.setAttribute('aria-expanded', 'false');
                                    buttonToggle.setAttribute('aria-label', 'expand');
                                    iconToggle.classList.remove('hi-chevron-up');
                                    iconToggle.classList.add('hi-chevron-down');
                                    section.classList.remove('inner-visible');
                                }
                            }
                        }
                    }
                });

                this.on('button.btn-toggle:click', _toggle.bind(this));
            },
            get header() {
                return this._header;
            },

            set header(newValue) {
                var header = this.querySelector('header'),
                    backLink;

                if (!header) {
                    header = this.ownerDocument.createElement('header');
                    this.appendChild(header);
                }
                while (header.firstElementChild) {
                    header.removeChild(header.firstElementChild);
                }
                newValue.forEach(function(elem) {
                    header.appendChild(elem);
                });
                backLink = header.querySelector('.ha-back-links');
                if (backLink) {
                    header.classList.add('ha-stage-contains-back-links');
                } else {
                    header.classList.remove('ha-stage-contains-back-links');
                }
            },

            get section() {
                return this._section;
            },

            set section(newValue) {
                var section = this.querySelector('section');
                if (!section) {
                    section = this.ownerDocument.createElement('section');
                    this.appendChild(section);
                }
                _updateAriaControls(this);
                while (section.firstElementChild) {
                    section.removeChild(section.firstElementChild);
                }
                if (Array.isArray(newValue)) {
                    newValue.forEach(function(elem) {
                        section.appendChild(elem);
                    });
                } else {
                    section.appendChild(newValue);
                }

                if (!this.collapsible) {
                    section.classList.add('inner-visible');
                }

                this._section = newValue;
            },

            /**
             * Show the details of the stage if collapsible
             * When the user clicks to expand or show the details of the stage
             * @emits HA-STAGE#show
            */
            show: function() {
                if (this.collapsible && !this.open) {
                    this.open = true;
                    this.emit('show');
                }
            },

            /**
             * Closes the stage if collapsible
             * When the user clicks to collapse or hide the details of the stage
             * @emits HA-STAGE#close
            */
            close: function() {
                if (this.collapsible && this.open) {
                    this.open = false;
                    this.emit('close');
                }
            },

            postRender: function _() {
                _.super(this);
                var buttonToggle = this.querySelector('.btn-toggle');
                /* istanbul ignore if */
                if (buttonToggle) {
                    this.removeChild(buttonToggle);
                }
                contentNode.storeCachedInput(this, _contentPropertyMap);
            }
        });

        return register('ha-stage', HAStage);
    });

define('hui/textfield-type-ahead',[
    'register-component/v2/register',
    'object-utils/classes',
    './typeahead-base',
    './core/utils'
], function(register, classes, typeaheadBase, utils) {
    'use strict';

    var HATextfieldTypeAhead = classes.createObject(typeaheadBase, {

        init: function _() {

            _.super(this);

            /**
             * The element that the validator will use to get the values to validate
             * @type {HTMLElement}
             */
            this.validationTarget = this;

            this.setupProperties({
                /**
                 * The label for this select.
                 * @property label
                 * @type {String}
                 */
                label: {
                    default: '',
                    type: String,
                    change: function(newValue) {
                        var label = this.querySelector('label'),
                            // FIXME: we reached the ha-text-field local input just to set attributes
                            textFieldLocalInput = this.querySelector('.search-container ha-text-field input'),
                            labelId;

                        if (newValue) {
                            if (!label) {
                                label = this.ownerDocument.createElement('label');
                                this.insertBefore(label, this.firstElementChild);

                                labelId = this.localName + '-label-' + this.componentId;
                                label.setAttribute('id', labelId);
                                label.setAttribute('for', textFieldLocalInput.id);
                            } else {
                                // label exists already, use it's id to set
                                textFieldLocalInput.id = label.getAttribute('for');
                            }

                            label.textContent = utils.toggleSuffixText(newValue, ' *', this.required);
                            textFieldLocalInput.removeAttribute('aria-label');
                        } else {
                            if (label) {
                                this.removeChild(label);
                            }
                            if (this.placeholder) {
                                textFieldLocalInput.setAttribute('aria-label', this.placeholder);
                            }
                        }
                    }
                },

                /**
                 * Disabled indicates if the menu button is disabled.
                 * @type {Boolean}
                 */
                disabled: {
                    default: false,
                    type: Boolean,
                    change: function(newValue) {
                        this.querySelector('ha-text-field.search').disabled = newValue;
                        if (newValue) {
                            this.classList.add('disabled');
                        } else {
                            this.classList.remove('disabled');
                        }
                    }
                },

                /**
                 * Specifies the maximum number of characters that the user can enter.
                 * @type {Number}
                 */
                maxLength: {
                    default: 524288,
                    type: Number,
                    change: function(newValue) {
                        this.querySelector('ha-text-field.search').maxLength = newValue;
                    }
                },

                /**
                 * this sets the size for the text input
                 * @type {Number}
                 */
                size: {
                    default: 20,
                    type: Number,
                    change: function(newValue) {
                        this.querySelector('ha-text-field.search').size = newValue;
                    }
                }
            });
        },

        _getTriggerElement: function() {
            return this._getInputElement();
        }
    });

    return register('ha-textfield-type-ahead', HATextfieldTypeAhead);
});
