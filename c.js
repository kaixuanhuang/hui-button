(function(AD_CONFIG, LINKS, RT_CONFIG) {
    /*! Copyright 2016 Baidu Inc. All Rights Reserved. */
    var AD_CONFIG = {
        box: {
            is_cut_show: true,
            cut_height: 75 + 25,
            visual_height: 26,
            box_bg_opacity: 0.75,
            theme: 5
        }
    };
    ;var Mustache = "undefined" !== typeof module && module.exports || {};
    (function(p) {
        function y(a) {
            return String(a).replace(/&(?!\w+;)|[<>"']/g, function(a) {
                return z[a] || a
            })
        }
        function w(a, b, e) {
            if ("." === a)
                return b[b.length - 1];
            a = a.split(".");
            for (var c = a.length - 1, d = a[c], f, g, s = b.length, n, r; s; ) {
                r = b.slice(0);
                g = b[--s];
                for (n = 0; n < c; ) {
                    g = g[a[n++]];
                    if (null == g)
                        break;
                    r.push(g)
                }
                if (g && "object" === typeof g && d in g) {
                    f = g[d];
                    break
                }
            }
            "function" === typeof f && (f = f.call(r[r.length - 1]));
            return null == f ? e : f
        }
        function A(a, b, e, c) {
            var d = "";
            a = w(a, b);
            if (c) {
                if ("" === a || null == a || !1 === a || "[object Array]" === {}.toString.call(a) && 0 === a.length)
                    d += e()
            } else if ("[object Array]" === {}.toString.call(a)) {
                var f = a.length;
                B(a, function(a, c) {
                    var g = {
                        "@index": c,
                        _index: c + 1,
                        "@first": 0 === c,
                        "@size": f,
                        "@last": c === f - 1,
                        "@odd": 1 === (c & 1),
                        "@even": 0 === (c & 1)
                    }, k;
                    for (k in g)
                        g.hasOwnProperty(k) && (a[k] = g[k]);
                    b.push(a);
                    d += e();
                    for (k in g)
                        g.hasOwnProperty(k) && delete a[k];
                    b.pop()
                })
            } else if ("object" === typeof a)
                b.push(a),
                    d += e(),
                    b.pop();
            else if ("function" === typeof a)
                var g = b[b.length - 1]
                    , d = d + (a.call(g, e(), function(a) {
                        return q(a, g)
                    }) || "");
            else
                a && (d += e());
            return d
        }
        function x(a, b) {
            b = b || {};
            for (var e = b.tags || p.tags, c = e[0], d = e[e.length - 1], f = ['var buffer = "";', "\nvar line = 1;", "\ntry {", '\nbuffer += "'], g = [], s = !1, n = !1, r = function() {
                if (!s || n || b.space)
                    g = [];
                else
                    for (; g.length; )
                        f.splice(g.pop(), 1);
                n = s = !1
            }, k = [], u, q, C, w = function(a) {
                e = t(a).split(/\s+/);
                q = e[0];
                C = e[e.length - 1]
            }, x = function(a) {
                f.push('";', u, '\nvar partial = partials["' + t(a) + '"];', "\nif (partial) {", "\n  buffer += render(partial,stack[stack.length - 1],partials);", "\n}", '\nbuffer += "')
            }, v = function(a, d) {
                var b = t(a);
                if ("" === b)
                    throw Error("Section name may not be empty");
                k.push({
                    name: b,
                    inverted: d
                });
                f.push('";', u, '\nvar name = "' + b + '";', "\nvar callback = (function () {", "\n  return function () {", '\n    var buffer = "";', '\nbuffer += "')
            }, y = function(a) {
                v(a, !0)
            }, z = function(a) {
                a = t(a);
                var b = 0 != k.length && k[k.length - 1].name;
                if (!b || a != b)
                    throw Error('Section named "' + a + '" was never opened');
                a = k.pop();
                f.push('";', "\n    return buffer;", "\n  };", "\n})();");
                a.inverted ? f.push("\nbuffer += renderSection(name,stack,callback,true);") : f.push("\nbuffer += renderSection(name,stack,callback);");
                f.push('\nbuffer += "')
            }, A = function(a) {
                f.push('";', u, '\nbuffer += lookup("' + t(a) + '",stack,"");', '\nbuffer += "')
            }, B = function(a) {
                f.push('";', u, '\nbuffer += escapeHTML(lookup("' + t(a) + '",stack,""));', '\nbuffer += "')
            }, D = 1, m, l, h = 0, E = a.length; h < E; ++h)
                if (a.slice(h, h + c.length) === c) {
                    h += c.length;
                    m = a.substr(h, 1);
                    u = "\nline = " + D + ";";
                    q = c;
                    C = d;
                    s = !0;
                    switch (m) {
                        case "!":
                            h++;
                            l = null;
                            break;
                        case "=":
                            h++;
                            d = "=" + d;
                            l = w;
                            break;
                        case ">":
                            h++;
                            l = x;
                            break;
                        case "#":
                            h++;
                            l = v;
                            break;
                        case "^":
                            h++;
                            l = y;
                            break;
                        case "/":
                            h++;
                            l = z;
                            break;
                        case "{":
                            d = "}" + d;
                        case "&":
                            h++;
                            n = !0;
                            l = A;
                            break;
                        default:
                            n = !0,
                                l = B
                    }
                    m = a.indexOf(d, h);
                    if (-1 === m)
                        throw Error('Tag "' + c + '" was not closed properly');
                    c = a.substring(h, m);
                    l && l(c);
                    for (l = 0; ~(l = c.indexOf("\n", l)); )
                        D++,
                            l++;
                    h = m + d.length - 1;
                    c = q;
                    d = C
                } else
                    switch (m = a.substr(h, 1),
                        m) {
                        case '"':
                        case "\\":
                            n = !0;
                            f.push("\\" + m);
                            break;
                        case "\r":
                            break;
                        case "\n":
                            g.push(f.length);
                            f.push("\\n");
                            r();
                            D++;
                            break;
                        default:
                            /^\s*$/.test(m) ? g.push(f.length) : n = !0,
                                f.push(m)
                    }
            if (0 != k.length)
                throw Error('Section "' + k[k.length - 1].name + '" was not closed properly');
            r();
            f.push('";', "\nreturn buffer;", "\n} catch (e) { throw {error: e, line: line}; }");
            d = f.join("").replace(/buffer \+= "";\n/g, "");
            b.debug && ("undefined" != typeof console && console.log ? console.log(d) : "function" === typeof print && print(d));
            return d
        }
        function E(a, b) {
            var e = x(a, b)
                , c = new Function("view,partials,stack,lookup,escapeHTML,renderSection,render",e);
            return function(a, b) {
                b = b || {};
                var g = [a];
                try {
                    return c(a, b, g, w, y, A, q)
                } catch (e) {
                    throw Error(e.error + "\n" + e.line);
                }
            }
        }
        function v(a, b) {
            b = b || {};
            return E(a, b)
        }
        function q(a, b, e) {
            return v(a)(b, e)
        }
        p.name = "mustache.js";
        p.version = "0.5.0-dev";
        p.tags = ["{{", "}}"];
        p.parse = x;
        p.compile = v;
        p.render = q;
        p.to_html = function(a, b, e, c) {
            a = q(a, b, e);
            if ("function" === typeof c)
                c(a);
            else
                return a
        }
        ;
        var B = function(a, b, e) {
            for (var c = 0, d = a.length; c < d; ++c)
                b.call(e, a[c], c, a)
        }
            , t = function(a) {
            return null == a ? "" : String(a).replace(/(^[\s\xA0]+)|([\s\xA0]+$)/g, "")
        }
            , z = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        }
    })(Mustache);
    ;var AD_TEMPLATE_CONTENT = "<!-- target:AD_ad_widget_imageplus_sticker_box -->\n<div class=\"ad-widget-imageplus-sticker {{box._theme_class}}\">\n{{#box.is_cut_show}}<div class=\"ad-widget-imageplus-sticker ad-widget-imageplus-sticker-wrapper ad-widget-imageplus-sticker-box-showing\" id=\"{{#_id}}wrapper{{/_id}}\">{{/box.is_cut_show}}\n<div class=\"ad-widget-imageplus-sticker-bg\" id=\"{{#_id}}background{{/_id}}\" style=\"{{#box.background_color}}background:{{box.background_color}} !important;{{/box.background_color}}\"></div>\n<div class=\"ad-widget-imageplus-sticker-bd\" id=\"{{#_id}}body{{/_id}}\">\n{{{_content}}}\n</div>\n{{#box.is_cut_show}}</div>{{/box.is_cut_show}}\n<a class=\"ad-widget-imageplus-sticker-close {{#box.round_close}}ad-widget-imageplus-sticker-close-newstyle{{/box.round_close}}\" href=\"#\" id=\"{{#_id}}close{{/_id}}\">X</a>\n</div>\n<div class=\"ad-widget-imageplus-sticker-thumbnail\" id=\"{{#_id}}thumbnail{{/_id}}\" style=\"display:none;\">\n<a href=\"#\" title=\"\u70b9\u51fb\u5c55\u5f00\"><i>&nbsp;</i>\u56fe\u7247\u76f8\u5173\u4fe1\u606f</a>\n</div>\n<!-- target:AD_ad_widget_imageplus_sticker_pa_links_new -->\n<div class=\"baiduimageplus-s-pa\">\n<div class=\"baiduimageplus-s-pa-bg\" id=\"{{#_id}}background{{/_id}}\"></div>\n<div class=\"baiduimageplus-s-pa-ct\">\n<div class=\"baiduimageplus-s-pa-hd\">\n<a data-log=\"2\" data-mid=\"{{{mid}}}\" href=\"{{{real_url}}}\" target=\"_blank\" style=\"{{#box.pa.title_color}}color:{{box.pa.title_color}} !important;{{/box.pa.title_color}}\">{{title}}</a>\n</div>\n<div class=\"baiduimageplus-s-pa-bd\">\n<a class=\"baiduimageplus-s-pa-img {{#box.big_img}}baiduimageplus-s-pa-img-bigoutter{{/box.big_img}}\" href=\"{{{real_url}}}\" data-log=\"2\" data-mid=\"{{{mid}}}\" target=\"_blank\">\n<img src=\"{{idea_url}}\"/>\n</a>\n<div class=\"baiduimageplus-s-pa-txt\">\n<p class=\"baiduimageplus-s-pa-title\">\n<a data-log=\"2\" data-mid=\"{{{mid}}}\" href=\"{{{real_url}}}\" target=\"_blank\" style=\"{{#box.pa.description_title_color}}color:{{box.pa.description_title_color}} !important;{{/box.pa.description_title_color}}\">{{title}}</a>\n</p>\n<p class=\"baiduimageplus-s-pa-desc\" {{^_urls}}style=\"height:36px;white-space:normal;\"{{/_urls}}>\n<a id=\"{{#_id}}desc{{/_id}}\" data-log=\"2\" data-mid=\"{{{mid}}}\" href=\"{{{real_url}}}\" target=\"_blank\" style=\"{{#box.pa.description_color}}color:{{box.pa.description_color}} !important;{{/box.pa.description_color}}\">{{{desc}}}</a>\n</p>\n<p class=\"baiduimageplus-s-pa-links\">\n{{#_urls}}\n<a data-log=\"2\" data-mid=\"{{{mid}}}\" href=\"{{{url}}}\" target=\"_blank\" style=\"{{#box.pa.description_color}}color:{{box.pa.description_color}} !important;{{/box.pa.description_color}}\">{{{title}}}</a>\n{{/_urls}}\n</p>\n</div>\n<a class=\"baiduimageplus-s-pa-bt\" id=\"{{#_id}}lookbtnshake{{/_id}}\" data-log=\"2\" data-mid=\"{{{mid}}}\" href=\"{{{real_url}}}\" target=\"_blank\">\u53bb\u770b\u770b</a>\n</div>\n</div>\n<a class=\"baiduimageplus-s-pa-adslogo\" id=\"{{#_id}}baidu-adslogo{{/_id}}\" title=\"\u767e\u5ea6\u7f51\u76df\u63a8\u5e7f\" href=\"http://wangmeng.baidu.com\" target=\"_blank\" data-ignore></a>\n<div class=\"baiduimageplus-s-pa-adstext\" id=\"{{#_id}}baidu-adstext{{/_id}}\"></div>\n</div>";
    ;var AD_STYLE_CONTENT = ".ad-widget-imageplus-sticker{font:12px/1.5 arial,sans-serif;position:absolute;left:0;width:100%;display:none;overflow:hidden;color:#FFF;background:transparent;-webkit-transition:height .5s,top .5s;transition:height .5s,top .5s}.ad-widget-imageplus-sticker div{background:transparent}.ad-widget-imageplus-sticker-cut{display:block}.ad-widget-imageplus-sticker-bg{position:absolute;z-index:1;left:0;top:0;width:100%;height:100%;background:#000!important;box-shadow:2px 2px 4px #000}.ad-widget-imageplus-sticker-bd{position:relative;z-index:2;left:0;top:0;width:100%;overflow:hidden}.ad-widget-imageplus-sticker-close{position:absolute;z-index:3;right:0;top:5px;width:25px;height:25px;line-height:25px;text-decoration:none;text-align:center;font-size:18px;color:#FFF!important}.ad-widget-imageplus-sticker-close:hover{background-color:#000}\n.ad-widget-imageplus-sticker-theme-white{color:#333}.ad-widget-imageplus-sticker-theme-white .ad-widget-imageplus-sticker-bg{background:#FFF!important;box-shadow:2px 2px 4px #FFF}.ad-widget-imageplus-sticker-theme-white .ad-widget-imageplus-sticker-close{color:#666!important}.ad-widget-imageplus-sticker-theme-white .ad-widget-imageplus-sticker-close:hover{background-color:#FFF!important}.ad-widget-imageplus-sticker-theme-none{color:#333}.ad-widget-imageplus-sticker-theme-none .ad-widget-imageplus-sticker-bg{background:transparent!important;box-shadow:none}.ad-widget-imageplus-sticker-theme-none .ad-widget-imageplus-sticker-close{color:#666!important}.ad-widget-imageplus-sticker-theme-none .ad-widget-imageplus-sticker-close:hover{background-color:#FFF!important}.ad-widget-imageplus-sticker-theme-none-white{color:#333}\n.ad-widget-imageplus-sticker-theme-none-white .ad-widget-imageplus-sticker-bg{background:transparent!important;box-shadow:none}.ad-widget-imageplus-sticker-theme-none-white-2 .ad-widget-imageplus-sticker-bg{background:transparent!important;box-shadow:none}.ad-widget-imageplus-sticker-theme-none-white-2 .ad-widget-imageplus-sticker-close{top:0;text-indent:-9999px;background:url(//ecma.bdimg.com/public03/imageplus/v2/dock/close.png) no-repeat 0 0 transparent}.ad-widget-imageplus-sticker-theme-v2 .ad-big-title{position:relative;top:0;opacity:1;filter:alpha(opacity=100);-webkit-transition:top .5s,opacity .6s;transition:top .5s,opacity .6s}.ad-widget-imageplus-sticker-theme-v2 .ad-widget-imageplus-sticker-showing .ad-big-title{position:relative;top:-36px;opacity:0;filter:alpha(opacity=0)}.ad-widget-imageplus-sticker-theme-v2 .ad-widget-imageplus-sticker-showing .ad-widget-imageplus-sticker-bg{top:26px}\n.ad-widget-imageplus-sticker-theme-v2 .ad-widget-imageplus-sticker-close{top:0;text-indent:-9999px;background:url(//ecma.bdimg.com/public03/imageplus/v2/dock/close.png) no-repeat 0 0 transparent}.ad-widget-imageplus-sticker-thumbnail{font:12px/1.5 arial,sans-serif;position:absolute;right:0;top:0;height:20px;width:100px;overflow:hidden;background:transparent;-webkit-transition:height .5s;-moz-transition:height .5s;-ms-transition:height .5s;-o-transition:height .5s;transition:height .5s;background-color:rgba(0,0,0,0.5);filter:progid:DXImageTransform.Microsoft.gradient(startColorstr=#80000000,endColorstr=#80000000);-ms-filter:progid:DXImageTransform.Microsoft.gradient(startColorstr=#80000000,endColorstr=#80000000)}.ad-widget-imageplus-sticker-thumbnail a{float:right;width:100px;height:20px;line-height:20px;text-align:center;color:white;background:transparent;text-decoration:none}\n.ad-widget-imageplus-sticker-thumbnail i{width:12px;height:8px;margin-top:6px;margin-left:5px;display:block;float:left;background:url('//ecma.bdimg.com/adtest/8e547549c94ab88c81b644d5ff63b0d3.png') no-repeat 0 0;background:none \\9;filter:progid:DXImageTransform.Microsoft.AlphaImageLoader(enabled='true',sizingMethod='corp',src='//ecma.bdimg.com/adtest/8e547549c94ab88c81b644d5ff63b0d3.png')\\9}.ad-widget-imageplus-sticker-close-newstyle{top:0;text-indent:-9999px;background:url(//ecmb.bdimg.com/public03/v2/dock/iconfont-close.png) no-repeat 0 0 transparent!important}.baiduimageplus-s-pa{position:relative;width:100%;height:101px;overflow:hidden;cursor:default;-webkit-transition:top .5s;-moz-transition:top .5s;-ms-transition:top .5s;-o-transition:top .5s;transition:top .5s}.baiduimageplus-s-pa a{outline:0;text-decoration:none}\n.baiduimageplus-s-pa a:hover{text-decoration:underline}.baiduimageplus-s-pa .baiduimageplus-s-pa-bg{position:absolute;top:0;left:0;width:100%;height:100%;z-index:1}.baiduimageplus-s-pa .baiduimageplus-s-pa-ct{position:relative;z-index:2}.baiduimageplus-s-pa .baiduimageplus-s-pa-hd{height:26px;line-height:26px;text-indent:10px}.baiduimageplus-s-pa .baiduimageplus-s-pa-hd a{font-size:14px;color:#FFF}.baiduimageplus-s-pa .baiduimageplus-s-pa-bd{position:relative;margin:10px 0;overflow:hidden;_zoom:1}.baiduimageplus-s-pa .baiduimageplus-s-pa-img{float:left;_display:inline;width:50px;height:50px;margin:5px 12px 0 10px}.baiduimageplus-s-pa .baiduimageplus-s-pa-img img{display:block;width:50px;height:50px;border:0}.baiduimageplus-s-pa .baiduimageplus-s-pa-img-bigoutter{float:left;_display:inline;width:70px;height:70px;_width:65px;_height:65px;margin:-20px 12px 0 10px;_margin:5px 5px 0 5px;_postion:relative}\n.baiduimageplus-s-pa .baiduimageplus-s-pa-img-bigoutter img{width:70px;height:70px;_position:absolute;_top:-20px;_left:5px}.baiduimageplus-s-pa .baiduimageplus-s-pa-txt{margin-right:85px;height:54px;overflow:hidden;zoom:1;line-height:1.5;word-wrap:break-word;font-size:12px;text-align:left;text-decoration:none;-webkit-line-clamp:2}.baiduimageplus-s-pa .baiduimageplus-s-pa-txt a{color:#FFF}.baiduimageplus-s-pa .baiduimageplus-s-pa-txt a:hover{text-decoration:underline}.baiduimageplus-s-pa .baiduimageplus-s-pa-title,.baiduimageplus-s-pa .baiduimageplus-s-pa-desc,.baiduimageplus-s-pa .baiduimageplus-s-pa-links{float:none;padding:0;border:0;position:static;display:block;visibility:visible;text-align:left;background:transparent;-webkit-box-sizing:content-box;box-sizing:content-box;margin:0;height:18px;line-height:18px;zoom:1;color:#FFF;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}\n.baiduimageplus-s-pa .baiduimageplus-s-pa-links a{float:left;_display:inline;padding:0 7px;color:#FFF;border-left:1px solid #999;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.baiduimageplus-s-pa .baiduimageplus-s-pa-links a:last-child{margin-right:0}.baiduimageplus-s-pa .baiduimageplus-s-pa-links a:first-child{border-left:none;padding-left:0}.baiduimageplus-s-pa .baiduimageplus-s-pa-links a:hover{text-decoration:underline}.baiduimageplus-s-pa .baiduimageplus-s-pa-title,.baiduimageplus-s-pa .baiduimageplus-s-pa-title a{color:#CCC}.baiduimageplus-s-pa .baiduimageplus-s-pa-bt{position:absolute;top:20px;right:10px;margin:0;width:70px;height:25px;display:block;text-decoration:none;color:#FFF;font-size:14px;text-align:center;line-height:25px;background:#bc0000;box-shadow:2px 2px 4px #000;border-radius:5px}\n.baiduimageplus-s-pa .baiduimageplus-s-pa-bt:hover{-webkit-animation:none;animation:none;text-decoration:none;background-color:#ea2b2b}.baiduimageplus-s-pa .baiduimageplus-s-pa-adslogo{position:absolute;bottom:0;right:31.2px;z-index:3;height:16.8px;width:16.8px;background:url(//ecma.bdimg.com/public03/imageplus/logo/pc_ads_logo_20161223.png) no-repeat;background-size:100% 100%;display:none}.baiduimageplus-s-pa .baiduimageplus-s-pa-adstext{position:absolute;right:0;bottom:0;width:31.2px;height:16.8px;overflow:hidden;z-index:12;background:url(//ecma.bdimg.com/public03/imageplus/logo/pc_ads_20161223.png) no-repeat;background-size:100% 100%}.ad-widget-imageplus-sticker-showing .baiduimageplus-s-pa-hd{opacity:0;filter:alpha(opacity=0)}.baiduimageplus-s-pa-links a{background:url(http://ecma.bdimg.com/adtest/5d5a28881dc5b110114e55cf6d4f69ec.png) no-repeat left top;background-position:0 0;_filter:progid:dximagetransform.microsoft.alphaimageloader(enabled=true,src=\" http://ecma.bdimg.com/adtest/5d5a28881dc5b110114e55cf6d4f69ec.png\",sizingMethod=\"crop\");_background:none;display:inline-block;margin-right:3px!important;padding-left:13px!important;padding-right:7px;border:0!important}\n.baiduimageplus-s-pa-links a:hover{text-decoration:underline}";
    ;var baidu = {
        version: "1.5.0"
    };
    baidu.guid = "$BAIDU$";
    window[baidu.guid] = window[baidu.guid] || {};
    baidu.event = baidu.event || {};
    baidu.event._listeners = baidu.event._listeners || [];
    baidu.dom = baidu.dom || {};
    baidu.lang = baidu.lang || {};
    baidu.lang.isString = function(a) {
        return "[object String]" == Object.prototype.toString.call(a)
    }
    ;
    baidu.isString = baidu.lang.isString;
    baidu.dom._g = function(a) {
        if (baidu.lang.isString(a)) {
            return document.getElementById(a)
        }
        return a
    }
    ;
    baidu._g = baidu.dom._g;
    baidu.event._eventFilter = baidu.event._eventFilter || {};
    baidu.dom.contains = function(a, b) {
        var c = baidu.dom._g;
        a = c(a);
        b = c(b);
        return a.contains ? a != b && a.contains(b) : !!(a.compareDocumentPosition(b) & 16)
    }
    ;
    baidu.dom.g = function(a) {
        if ("string" == typeof a || a instanceof String) {
            return document.getElementById(a)
        } else {
            if (a && a.nodeName && (a.nodeType == 1 || a.nodeType == 9)) {
                return a
            }
        }
        return null
    }
    ;
    baidu.g = baidu.G = baidu.dom.g;
    baidu.dom.getDocument = function(a) {
        a = baidu.dom.g(a);
        return a.nodeType == 9 ? a : a.ownerDocument || a.document
    }
    ;
    baidu.event._eventFilter._crossElementBoundary = function(a, d) {
        var c = d.relatedTarget
            , b = d.currentTarget;
        if (c === false || b == c || (c && (c.prefix == "xul" || baidu.dom.contains(b, c)))) {
            return
        }
        return a.call(b, d)
    }
    ;
    baidu.fn = baidu.fn || {};
    baidu.fn.bind = function(b, a) {
        var c = arguments.length > 2 ? [].slice.call(arguments, 2) : null;
        return function() {
            var e = baidu.lang.isString(b) ? a[b] : b
                , d = (c) ? c.concat([].slice.call(arguments, 0)) : arguments;
            return e.apply(a || e, d)
        }
    }
    ;
    baidu.event._eventFilter.mouseenter = window.attachEvent ? null : function(a, b, c) {
            return {
                type: "mouseover",
                listener: baidu.fn.bind(baidu.event._eventFilter._crossElementBoundary, this, c)
            }
        }
    ;
    baidu.event._eventFilter.mouseleave = window.attachEvent ? null : function(a, b, c) {
            return {
                type: "mouseout",
                listener: baidu.fn.bind(baidu.event._eventFilter._crossElementBoundary, this, c)
            }
        }
    ;
    baidu.event.on = function(b, e, g) {
        e = e.replace(/^on/i, "");
        b = baidu.dom._g(b);
        var f = function(i) {
            g.call(b, i)
        }, a = baidu.event._listeners, d = baidu.event._eventFilter, h, c = e;
        e = e.toLowerCase();
        if (d && d[e]) {
            h = d[e](b, e, f);
            c = h.type;
            f = h.listener
        }
        if (b.addEventListener) {
            b.addEventListener(c, f, false)
        } else {
            if (b.attachEvent) {
                b.attachEvent("on" + c, f)
            }
        }
        a[a.length] = [b, e, g, f, c];
        return b
    }
    ;
    baidu.on = baidu.event.on;
    baidu.fn.blank = function() {}
    ;
    baidu.string = baidu.string || {};
    (function() {
        var a = new RegExp("(^[\\s\\t\\xa0\\u3000]+)|([\\u3000\\xa0\\s\\t]+\x24)","g");
        baidu.string.trim = function(b) {
            return String(b).replace(a, "")
        }
    })();
    baidu.trim = baidu.string.trim;
    baidu.string.escapeReg = function(a) {
        return String(a).replace(new RegExp("([.*+?^=!:\x24{}()|[\\]/\\\\])","g"), "\\\x241")
    }
    ;
    baidu.dom.q = function(h, e, b) {
        var j = [], d = baidu.string.trim, g, f, a, c;
        if (!(h = d(h))) {
            return j
        }
        if ("undefined" == typeof e) {
            e = document
        } else {
            e = baidu.dom.g(e);
            if (!e) {
                return j
            }
        }
        b && (b = d(b).toUpperCase());
        if (e.getElementsByClassName) {
            a = e.getElementsByClassName(h);
            g = a.length;
            for (f = 0; f < g; f++) {
                c = a[f];
                if (b && c.tagName != b) {
                    continue
                }
                j[j.length] = c
            }
        } else {
            h = new RegExp("(^|\\s)" + baidu.string.escapeReg(h) + "(\\s|\x24)");
            a = b ? e.getElementsByTagName(b) : (e.all || e.getElementsByTagName("*"));
            g = a.length;
            for (f = 0; f < g; f++) {
                c = a[f];
                h.test(c.className) && (j[j.length] = c)
            }
        }
        return j
    }
    ;
    baidu.q = baidu.Q = baidu.dom.q;
    baidu.dom.hasAttr = function(c, b) {
        c = baidu.g(c);
        var a = c.attributes.getNamedItem(b);
        return !!(a && a.specified)
    }
    ;
    baidu.abstractMethod = function() {
        throw Error("unimplemented abstract method")
    }
    ;
    baidu.string.getByteLength = function(a) {
        return String(a).replace(/[^\x00-\xff]/g, "ci").length
    }
    ;
    baidu.string.subByte = function(c, b, a) {
        c = String(c);
        a = a || "";
        if (b < 0 || baidu.string.getByteLength(c) <= b) {
            return c + a
        }
        c = c.substr(0, b).replace(/([^\x00-\xff])/g, "\x241 ").substr(0, b).replace(/[^\x00-\xff]$/, "").replace(/([^\x00-\xff]) /g, "\x241");
        return c + a
    }
    ;
    baidu.browser = baidu.browser || {};
    baidu.browser.ie = baidu.ie = /msie (\d+\.\d+)/i.test(navigator.userAgent) ? (document.documentMode || +RegExp["\x241"]) : undefined;
    baidu.object = baidu.object || {};
    baidu.extend = baidu.object.extend = function(c, a) {
        for (var b in a) {
            if (a.hasOwnProperty(b)) {
                c[b] = a[b]
            }
        }
        return c
    }
    ;
    baidu.dom._styleFixer = baidu.dom._styleFixer || {};
    baidu.dom._styleFilter = baidu.dom._styleFilter || [];
    baidu.dom._styleFilter.filter = function(b, e, f) {
        for (var a = 0, d = baidu.dom._styleFilter, c; c = d[a]; a++) {
            if (c = c[f]) {
                e = c(b, e)
            }
        }
        return e
    }
    ;
    baidu.string.toCamelCase = function(a) {
        if (a.indexOf("-") < 0 && a.indexOf("_") < 0) {
            return a
        }
        return a.replace(/[-_][^-_]/g, function(b) {
            return b.charAt(1).toUpperCase()
        })
    }
    ;
    baidu.dom.setStyle = function(c, b, d) {
        var e = baidu.dom, a;
        c = e.g(c);
        b = baidu.string.toCamelCase(b);
        if (a = e._styleFilter) {
            d = a.filter(b, d, "set")
        }
        a = e._styleFixer[b];
        (a && a.set) ? a.set(c, d) : (c.style[a || b] = d);
        return c
    }
    ;
    baidu.setStyle = baidu.dom.setStyle;
    baidu.array = baidu.array || {};
    baidu.each = baidu.array.forEach = baidu.array.each = function(g, e, b) {
        var d, f, c, a = g.length;
        if ("function" == typeof e) {
            for (c = 0; c < a; c++) {
                f = g[c];
                d = e.call(b || g, f, c);
                if (d === false) {
                    break
                }
            }
        }
        return g
    }
    ;
    baidu.dom.show = function(a) {
        a = baidu.dom.g(a);
        a.style.display = "";
        return a
    }
    ;
    baidu.show = baidu.dom.show;
    baidu.dom.removeClass = function(f, g) {
        f = baidu.dom.g(f);
        var d = f.className.split(/\s+/), h = g.split(/\s+/), b, a = h.length, c, e = 0;
        for (; e < a; ++e) {
            for (c = 0,
                     b = d.length; c < b; ++c) {
                if (d[c] == h[e]) {
                    d.splice(c, 1);
                    break
                }
            }
        }
        f.className = d.join(" ");
        return f
    }
    ;
    baidu.removeClass = baidu.dom.removeClass;
    baidu.dom._NAME_ATTRS = (function() {
        var a = {
            cellpadding: "cellPadding",
            cellspacing: "cellSpacing",
            colspan: "colSpan",
            rowspan: "rowSpan",
            valign: "vAlign",
            usemap: "useMap",
            frameborder: "frameBorder"
        };
        if (baidu.browser.ie < 8) {
            a["for"] = "htmlFor";
            a["class"] = "className"
        } else {
            a.htmlFor = "for";
            a.className = "class"
        }
        return a
    })();
    baidu.dom.getAttr = function(b, a) {
        b = baidu.dom.g(b);
        if ("style" == a) {
            return b.style.cssText
        }
        a = baidu.dom._NAME_ATTRS[a] || a;
        return b.getAttribute(a)
    }
    ;
    baidu.getAttr = baidu.dom.getAttr;
    baidu.dom.setAttr = function(b, a, c) {
        b = baidu.dom.g(b);
        if ("style" == a) {
            b.style.cssText = c
        } else {
            a = baidu.dom._NAME_ATTRS[a] || a;
            b.setAttribute(a, c)
        }
        return b
    }
    ;
    baidu.setAttr = baidu.dom.setAttr;
    baidu.sio = baidu.sio || {};
    baidu.sio.log = function(b) {
        var a = new Image()
            , c = "tangram_sio_log_" + Math.floor(Math.random() * 2147483648).toString(36);
        window[c] = a;
        a.onload = a.onerror = a.onabort = function() {
            a.onload = a.onerror = a.onabort = null;
            window[c] = null;
            a = null
        }
        ;
        a.src = b
    }
    ;
    baidu.dom.hide = function(a) {
        a = baidu.dom.g(a);
        a.style.display = "none";
        return a
    }
    ;
    baidu.hide = baidu.dom.hide;
    baidu.lang.inherits = function(g, e, d) {
        var c, f, a = g.prototype, b = new Function();
        b.prototype = e.prototype;
        f = g.prototype = new b();
        for (c in a) {
            f[c] = a[c]
        }
        g.prototype.constructor = g;
        g.superClass = e.prototype;
        if ("string" == typeof d) {
            f._className = d
        }
    }
    ;
    baidu.inherits = baidu.lang.inherits;
    baidu.dom.addClass = function(f, g) {
        f = baidu.dom.g(f);
        var b = g.split(/\s+/)
            , a = f.className
            , e = " " + a + " "
            , d = 0
            , c = b.length;
        for (; d < c; d++) {
            if (e.indexOf(" " + b[d] + " ") < 0) {
                a += (a ? " " : "") + b[d]
            }
        }
        f.className = a;
        return f
    }
    ;
    baidu.addClass = baidu.dom.addClass;
    baidu.event.preventDefault = function(a) {
        if (a.preventDefault) {
            a.preventDefault()
        } else {
            a.returnValue = false
        }
    }
    ;
    baidu.lang.isArray = function(a) {
        return "[object Array]" == Object.prototype.toString.call(a)
    }
    ;
    baidu.event.getTarget = function(a) {
        return a.target || a.srcElement
    }
    ;
    ;var q, r = r || {};
    r.global = this;
    r.V = !0;
    r.X = "en";
    r.W = !0;
    r.T = function(a) {
        return void 0 !== a
    }
    ;
    r.S = function(a, b, c) {
        a = a.split(".");
        c = c || r.global;
        a[0]in c || !c.execScript || c.execScript("var " + a[0]);
        for (var e; a.length && (e = a.shift()); )
            !a.length && r.T(b) ? c[e] = b : c = c[e] ? c[e] : c[e] = {}
    }
    ;
    r.ba = function(a, b, c) {
        r.S(a, b, c)
    }
    ;
    r.aa = function(a, b, c) {
        a[b] = c
    }
    ;
    r.fa = function() {
        return !1
    }
    ;
    r.ga = function() {}
    ;
    r.ea = function() {}
    ;
    var aa, s;
    if (s = /msie (\d+\.\d)/i.exec(navigator.userAgent))
        var t = document.documentMode || +s[1];
    if (s = /firefox\/(\d+\.\d)/i.exec(navigator.userAgent))
        var ba = +s[1];
    if (s = /opera\/(\d+\.\d)/i.exec(navigator.userAgent))
        var ca = +s[1];
    var da = navigator.userAgent
        , ea = da.match(/(\d+\.\d)?(?:\.\d)?\s+safari\/?(\d+\.\d+)?/i);
    ea && !/chrome/i.test(da) && (aa = +(ea[1] || ea[2]));
    s = /UCBrowser\/(\d+\.\d)/i.exec(navigator.userAgent);
    window.$ECMA$ = window.$ECMA$ || {};
    window.$ECMA$._instances = window.$ECMA$._instances || {};
    (function() {
        var a = window.$ECMA$;
        a.B = a.B || 1;
        return function() {
            return "ECMA__" + (a.B++).toString(36)
        }
    })();
    function fa(a, b, c) {
        var e = 2 < arguments.length ? [].slice.call(arguments, 2) : null
            , d = "[object String]" === Object.prototype.toString.call(a) ? b[a] : a
            , f = b || d
            , g = Function.prototype.bind;
        if (g) {
            var l = [].slice.call(arguments, 2);
            l.unshift(f);
            return g.apply(d, l)
        }
        return function() {
            var a = e ? e.concat([].slice.call(arguments, 0)) : arguments;
            return d.apply(f, a)
        }
    }
    ;function u(a, b) {
        for (var c in b)
            b.hasOwnProperty(c) && (a[c] = b[c]);
        return a
    }
    ;var v = [];
    function ga(a, b, c) {
        function e(b) {
            c.call(a, b)
        }
        b = b.replace(/^on/i, "");
        "string" === typeof a && (a = document.getElementById(a));
        var d = b;
        b = b.toLowerCase();
        if (w && w[b])
            var f = w[b](a, b, e)
                , d = f.type
                , e = f.J;
        a.addEventListener ? a.addEventListener(d, e, !1) : a.attachEvent && a.attachEvent("on" + d, e);
        v[v.length] = [a, b, c, e, d]
    }
    var w = w || {};
    w.C = function(a, b) {
        var c = b.relatedTarget
            , e = b.currentTarget;
        if (c && e !== c && (!c || "xul" !== c.prefix && !x.contains(e, c)))
            return a.call(e, b)
    }
    ;
    w.mouseenter = window.attachEvent ? null : function(a, b, c) {
            return {
                type: "mouseover",
                J: fa(w.C, this, c)
            }
        }
    ;
    w.mouseleave = window.attachEvent ? null : function(a, b, c) {
            return {
                type: "mouseout",
                J: fa(w.C, this, c)
            }
        }
    ;
    (function() {
        function a(a, b) {
            for (var c = 0, d = a.length, e = {}; c < d; c++)
                e[a[c]] = b[a[c]],
                    delete b[a[c]];
            return e
        }
        function b(b, c, d) {
            d = u({}, d);
            var e = a(l[c], d), f = [], g;
            for (g in e)
                e.hasOwnProperty(g) && f.push(e[g]);
            e = document.createEvent(c);
            f.unshift(b);
            "KeyEvents" === c ? e.initKeyEvent.apply(e, f) : "MouseEvents" === c ? e.initMouseEvent.apply(e, f) : "UIEvents" === c ? e.initUIEvent.apply(e, f) : e.initEvent.apply(e, f);
            u(e, d);
            return e
        }
        function c(a) {
            var b;
            document.createEventObject && (b = document.createEventObject(),
                u(b, a));
            return b
        }
        var e = {
            keydown: 1,
            keyup: 1,
            keypress: 1
        }
            , d = {
            click: 1,
            dblclick: 1,
            mousedown: 1,
            mousemove: 1,
            mouseup: 1,
            mouseover: 1,
            mouseout: 1
        }
            , f = {
            abort: 1,
            blur: 1,
            change: 1,
            error: 1,
            focus: 1,
            load: t ? 0 : 1,
            reset: 1,
            resize: 1,
            scroll: 1,
            select: 1,
            submit: 1,
            unload: t ? 0 : 1
        }
            , g = {
            scroll: 1,
            resize: 1,
            reset: 1,
            submit: 1,
            change: 1,
            select: 1,
            error: 1,
            abort: 1
        }
            , l = {
            KeyEvents: "bubbles cancelable view ctrlKey altKey shiftKey metaKey keyCode charCode".split(" "),
            MouseEvents: "bubbles cancelable view detail screenX screenY clientX clientY ctrlKey altKey shiftKey metaKey button relatedTarget".split(" "),
            HTMLEvents: ["bubbles", "cancelable"],
            UIEvents: ["bubbles", "cancelable", "view", "detail"],
            Events: ["bubbles", "cancelable"]
        };
        u(g, e);
        u(g, d);
        return function(p, n, h) {
            n = n.replace(/^on/i, "");
            p = x.g(p);
            h = u({
                bubbles: !0,
                cancelable: !0,
                view: window,
                detail: 1,
                screenX: 0,
                screenY: 0,
                clientX: 0,
                clientY: 0,
                ctrlKey: !1,
                altKey: !1,
                shiftKey: !1,
                metaKey: !1,
                keyCode: 0,
                charCode: 0,
                button: 0,
                relatedTarget: null
            }, h);
            if (e[n]) {
                var k = n;
                h = a(l.KeyEvents, h);
                var m;
                if (document.createEvent)
                    try {
                        m = b(k, "KeyEvents", h)
                    } catch (y) {
                        try {
                            m = b(k, "Events", h)
                        } catch (D) {
                            m = b(k, "UIEvents", h)
                        }
                    }
                else
                    h.keyCode = 0 < h.charCode ? h.charCode : h.keyCode,
                        m = c(h);
                h = m
            } else if (d[n])
                m = n,
                    h = a(l.MouseEvents, h),
                    document.createEvent ? (k = b(m, "MouseEvents", h),
                        h.relatedTarget && !k.relatedTarget && ("mouseout" === m.toLowerCase() ? k.toElement = h.relatedTarget : "mouseover" === m.toLowerCase() && (k.fromElement = h.relatedTarget))) : (m = h,
                            0 === h.button ? k = 1 : 1 === h.button ? k = 4 : (k = h.button,
                                        k = "[object Number]" === Object.prototype.toString.call(k) && isFinite(k) ? h.button : 0),
                            m.button = k,
                            k = c(h)),
                    h = k;
            else if (f[n]) {
                m = n;
                h.bubbles = g.hasOwnProperty(m);
                h = a(l.HTMLEvents, h);
                if (document.createEvent)
                    try {
                        k = b(m, "HTMLEvents", h)
                    } catch (V) {
                        try {
                            k = b(m, "UIEvents", h)
                        } catch (W) {
                            k = b(m, "Events", h)
                        }
                    }
                else
                    k = c(h);
                h = k
            } else
                throw Error(n + " is not support!");
            h && (p.dispatchEvent ? p.dispatchEvent(h) : p.fireEvent && p.fireEvent("on" + n, h))
        }
    })();
    var z = "sendlog";
    var ha = "function" === typeof "".trim ? function(a) {
                return String(a).trim()
            }
            : function(a) {
                return String(a).replace(/(^[\s\t\xa0\u3000\ufeff]+)|([\ufeff\u3000\xa0\s\t]+$)/g, "")
            }
        ;
    function ia(a) {
        return 0 > a.indexOf("-") && 0 > a.indexOf("_") ? a : a.replace(/[-_][^-_]/g, function(a) {
                return a.charAt(1).toUpperCase()
            })
    }
    ;function B(a, b) {
        for (var c = a.split("."), e = b || window, d; d = c.shift(); )
            if (null != e[d])
                e = e[d];
            else
                return null;
        return e
    }
    var ja = RT_CONFIG.HOSTMAP;
    ja || (ja = RT_CONFIG.HOSTMAP = {});
    "object" !== typeof RT_CONFIG || RT_CONFIG.HOST || (RT_CONFIG.HOST = function(a) {
            return RT_CONFIG.HOSTMAP[a] || "http://" + a
        }
    );
    function C(a, b) {
        function c(a, d) {
            baidu.lang.isArray(a) ? baidu.each(a, function(a, b) {
                    c(a, d.concat([b]))
                }) : b(a, d)
        }
        c(a, [])
    }
    function ka(a) {
        var b = B("bds.ready");
        "function" === typeof b && b(function() {
            a()
        })
    }
    function la(a, b) {
        var c = {}
            , e = {}
            , d = a.replace(/<\/?(?:span|font|em|strong)[^>]*>/g, function(a, b) {
            c[b] = a;
            return ""
        })
            , d = d.replace(/&[\w#]{2,};/g, function(a, b) {
            e[b] = a;
            return "*"
        });
        if (b >= baidu.string.getByteLength(d))
            return a;
        var d = baidu.string.subByte(d, b), f = [], g = 0, l, p = d.length, n = 0, h;
        for (h in e)
            if (e.hasOwnProperty(h)) {
                h = parseInt(h, 10);
                l = e[h];
                f.push(d.slice(g, h - n));
                g = h - n + 1;
                if (g > p)
                    break;
                f.push(l);
                n += l.length - 1
            }
        f.push(d.slice(g));
        d = f.join("");
        f = [];
        l = g = 0;
        for (var k in c)
            c.hasOwnProperty(k) && (k = parseInt(k, 10),
                p = c[k],
                k -= l,
                l += p.length,
                f.push(d.slice(g, k)),
                g = k,
                f.push(p));
        f.push(d.slice(g));
        f.push("...");
        d = f.join("");
        for (f = /<(span|font|em|strong)[^>]*><\/\1>/g; f.test(d); )
            f.lastIndex = 0,
                d = d.replace(f, ""),
                f.lastIndex = 0;
        return d
    }
    var E = {}
        , ma = {};
    function na(a, b) {
        oa();
        var c = setTimeout(a, b);
        E[c] = !0;
        return c
    }
    function F(a) {
        a && (delete E[a],
            clearTimeout(a))
    }
    var pa = !1;
    function oa() {
        pa || (H(function() {
            for (var a in E)
                E.hasOwnProperty(a) && F(parseInt(a, 10));
            for (a in ma)
                if (ma.hasOwnProperty(a)) {
                    var b = parseInt(a, 10);
                    b && (delete ma[b],
                        clearInterval(b))
                }
        }),
            pa = !0)
    }
    function H(a) {
        var b = B("bds.comm.registerUnloadHandler");
        "function" === typeof b ? b(a) : ka(function() {
                H(a)
            })
    }
    function I(a, b) {
        return "function" === typeof RT_CONFIG.CLASSNAME ? RT_CONFIG.CLASSNAME(a, b) : a
    }
    ;function J(a) {
        this.m = a || document;
        qa(this)
    }
    J.prototype.getDocument = function() {
        return this.m
    }
    ;
    J.prototype.g = function(a) {
        return "[object String]" === Object.prototype.toString.call(a) ? this.m.getElementById(a) : a && a.nodeName && (1 === a.nodeType || 9 === a.nodeType) ? a : null
    }
    ;
    J.prototype.on = function(a, b, c) {
        "string" === typeof a && (a = this.m.getElementById(a));
        a.addEventListener ? a.addEventListener(b, c, !1) : a.attachEvent && a.attachEvent("on" + b, function(b) {
                c.call(a, b)
            });
        return a
    }
    ;
    J.prototype.opacity = function(a, b) {
        a = this.g(a);
        var c = t && 9 > t;
        return null != b || 0 === b ? (c ? (c = a.style,
                    c.filter = "" + (c.filter || "").replace(/alpha\([^\)]*\)/gi, "") + (1 === b ? "" : "alpha(opacity=" + 100 * b + ")"),
                    c.zoom = 1) : a.style.opacity = b,
                "") : c ? (c = a.style.filter) && 0 <= c.indexOf("opacity=") ? parseFloat(c.match(/opacity=([^)]*)/)[1]) / 100 + "" : "1" : this.getStyle(a, "opacity")
    }
    ;
    J.prototype.contains = function(a, b) {
        a = this.g(a);
        b = this.g(b);
        return a.contains ? a !== b && a.contains(b) : !!(a.compareDocumentPosition(b) & 16)
    }
    ;
    J.prototype.show = function(a) {
        a = this.g(a);
        a.style.display = "";
        "none" === this.getComputedStyle(a, "display") && (a.style.display = "block");
        return a
    }
    ;
    q = J.prototype;
    q.hide = function(a) {
        a = this.g(a);
        a.style.display = "none";
        return a
    }
    ;
    q.addClass = function(a, b) {
        a = this.g(a);
        for (var c = b.split(/\s+/), e = a.className, d = " " + e + " ", f = 0, g = c.length; f < g; f++)
            0 > d.indexOf(" " + c[f] + " ") && (e += (e ? " " : "") + c[f]);
        a.className = e;
        return a
    }
    ;
    q.removeClass = function(a, b) {
        a = this.g(a);
        for (var c = b.split(/\s+/), e = a.className, d = " " + e + " ", f = 0, g = c.length; f < g; f++)
            0 <= d.indexOf(" " + c[f] + " ") && (e = e.replace(c[f], ""));
        e = e.replace(/\s+/g, " ");
        a.className = e;
        return a
    }
    ;
    q.getComputedStyle = function(a, b) {
        a = this.g(a);
        var c = a.ownerDocument;
        return c.defaultView && c.defaultView.getComputedStyle && (c = c.defaultView.getComputedStyle(a, null)) ? c[b] || c.getPropertyValue(b) : ""
    }
    ;
    q.getStyle = function(a, b) {
        a = this.g(a);
        b = ia(b);
        var c = (a.currentStyle ? a.currentStyle[b] : "") || this.getComputedStyle(a, b);
        if (!c || "auto" === c) {
            var e = K[b];
            e && (c = e.get ? e.get(a, b, c) : this.getStyle(a, e))
        }
        L && (c = ra(b, c, "get"));
        return c
    }
    ;
    var K = K || {};
    K.display = t && 8 > t ? {
            set: function(a, b) {
                var c = a.style;
                "inline-block" === b ? (c.display = "inline",
                        c.zoom = 1) : c.display = b
            }
        } : ba && 3 > ba ? {
                set: function(a, b) {
                    a.style.display = "inline-block" === b ? "-moz-inline-box" : b
                }
            } : null;
    K["float"] = t ? "styleFloat" : "cssFloat";
    K.opacity = t && 9 > t ? {
            get: function(a) {
                return (a = a.style.filter) && 0 <= a.indexOf("opacity=") ? parseFloat(a.match(/opacity=([^)]*)/)[1]) / 100 + "" : "1"
            },
            set: function(a, b) {
                var c = a.style;
                c.filter = (c.filter || "").replace(/alpha\([^\)]*\)/gi, "") + (1 == b ? "" : "alpha(opacity=" + 100 * b + ")");
                c.zoom = 1
            }
        } : null;
    var L = L || [];
    function ra(a, b, c) {
        for (var e = 0, d; d = L[e]; e++)
            (d = d[c]) && (b = d(a, b));
        return b
    }
    L[L.length] = {
        get: function(a, b) {
            if (/color/i.test(a) && -1 !== b.indexOf("rgb(")) {
                var c = b.split(",");
                b = "#";
                for (var e = 0, d; d = c[e]; e++)
                    d = parseInt(d.replace(/[^\d]/gi, ""), 10).toString(16),
                        b += 1 === d.length ? "0" + d : d;
                b = b.toUpperCase()
            }
            return b
        }
    };
    L[L.length] = {
        set: function(a, b) {
            b.constructor !== Number || /zIndex|fontWeight|opacity|zoom|lineHeight/i.test(a) || (b += "px");
            return b
        }
    };
    J.prototype.children = function(a) {
        a = this.g(a);
        var b = [];
        for (a = a.firstChild; a; a = a.nextSibling)
            1 === a.nodeType && b.push(a);
        return b
    }
    ;
    var M = {
        cellpadding: "cellPadding",
        cellspacing: "cellSpacing",
        colspan: "colSpan",
        rowspan: "rowSpan",
        valign: "vAlign",
        usemap: "useMap",
        frameborder: "frameBorder"
    };
    8 > t ? (M["for"] = "htmlFor",
            M["class"] = "className") : (M.htmlFor = "for",
            M.className = "class");
    q = J.prototype;
    q.getAttr = function(a, b) {
        a = this.g(a);
        if ("style" === b)
            return a.style.cssText;
        b = M[b] || b;
        return a.getAttribute(b)
    }
    ;
    q.setAttr = function(a, b, c) {
        a = this.g(a);
        "style" === b ? a.style.cssText = c : (b = M[b] || b,
                a.setAttribute(b, c));
        return a
    }
    ;
    q.setStyle = function(a, b, c) {
        a = this.g(a);
        b = ia(b);
        c = ra(b, c, "set");
        var e = K[b];
        e && e.set ? e.set(a, c) : a.style[e || b] = c;
        return a
    }
    ;
    q.insertBefore = function(a, b) {
        var c;
        a = this.g(a);
        b = this.g(b);
        (c = b.parentNode) && c.insertBefore(a, b);
        return a
    }
    ;
    q.q = function(a, b, c) {
        var e = [], d, f, g;
        if (!(a = ha(a)))
            return e;
        if ("undefined" === typeof b)
            b = this.m;
        else if (b = this.g(b),
                !b)
            return e;
        c && (c = ha(c).toUpperCase());
        if (b.getElementsByClassName)
            for (f = b.getElementsByClassName(a),
                     b = f.length,
                     d = 0; d < b; d++)
                g = f[d],
                c && g.tagName !== c || (e[e.length] = g);
        else
            for (a = RegExp("(^|\\s)" + String(a).replace(RegExp("([.*+?^=!:${}()|[\\]/\\\\-])", "g"), "\\$1") + "(\\s|$)"),
                     f = c ? b.getElementsByTagName(c) : b.all || b.getElementsByTagName("*"),
                     b = f.length,
                     d = 0; d < b; d++)
                g = f[d],
                a.test(g.className) && (e[e.length] = g);
        return e
    }
    ;
    q.hasAttr = function(a, b) {
        a = this.g(a);
        var c = a.attributes.getNamedItem(b);
        return !(!c || !c.specified)
    }
    ;
    function qa(a) {
        a.U || (a.U = function() {
            function b() {
                if (!b.isReady) {
                    b.isReady = !0;
                    for (var a = 0, c = e.length; a < c; a++)
                        e[a]()
                }
            }
            var c = !1
                , e = [];
            (function() {
                if (!c) {
                    c = !0;
                    var d = a.m
                        , e = window;
                    if (t && e === top)
                        (function() {
                            if (!b.isReady) {
                                try {
                                    d.documentElement.doScroll("left")
                                } catch (a) {
                                    setTimeout(arguments.callee, 0);
                                    return
                                }
                                b()
                            }
                        })();
                    else if (d.addEventListener) {
                        var g = ca ? function() {
                                if (!b.isReady) {
                                    for (var a = 0; a < d.styleSheets.length; a++)
                                        if (d.styleSheets[a].disabled) {
                                            setTimeout(arguments.callee, 0);
                                            return
                                        }
                                    b()
                                }
                            }
                            : b;
                        d.addEventListener("DOMContentLoaded", g, !1);
                        H(function() {
                            d.removeEventListener("DOMContentLoaded", g, !1)
                        })
                    } else if (aa) {
                        var l;
                        (function() {
                            if (!b.isReady)
                                if ("loaded" !== d.readyState && "complete" !== d.readyState)
                                    setTimeout(arguments.callee, 0);
                                else {
                                    if (void 0 === l) {
                                        l = 0;
                                        var a = d.getElementsByTagName("style")
                                            , c = d.getElementsByTagName("link");
                                        a && (l += a.length);
                                        if (c)
                                            for (var a = 0, e = c.length; a < e; a++)
                                                "stylesheet" === c[a].getAttribute("rel") && l++
                                    }
                                    d.styleSheets.length !== l ? setTimeout(arguments.callee, 0) : b()
                                }
                        })()
                    }
                    e.attachEvent ? (e.attachEvent("onload", b),
                            H(function() {
                                e.detachEvent("onload", b)
                            })) : e.addEventListener && (e.addEventListener("load", b, !1),
                            H(function() {
                                e.removeEventListener("load", b, !1)
                            }))
                }
            })();
            return function(a) {
                b.isReady ? a() : e[e.length] = a
            }
        }())
    }
    var x = new J;
    function N(a) {
        this.M = a
    }
    N.prototype.start = function(a, b) {
        !b && this.u && this.u.dispose && this.u.dispose();
        return this.u = this.M(!!a)
    }
    ;
    N.prototype.set = function(a, b) {
        "AD_CONFIG" === a ? AD_CONFIG = b : "LINKS" === a ? LINKS = b : "RT_CONFIG" === a && (RT_CONFIG = b)
    }
    ;
    N.prototype.get = function(a) {
        if ("AD_CONFIG" === a)
            return AD_CONFIG;
        if ("LINKS" === a)
            return LINKS;
        if ("RT_CONFIG" === a)
            return RT_CONFIG;
        if ("AD_STYLE_CONTENT" === a)
            return AD_STYLE_CONTENT
    }
    ;
    function sa() {}
    sa.prototype.attachTo = function() {}
    ;
    function ta() {
        this.v = ""
    }
    baidu.inherits(ta, sa);
    var ua = new ta;
    RT_CONFIG.__plugins || (RT_CONFIG.__plugins = []);
    RT_CONFIG.__plugins.push(ua);
    function va(a, b, c, e) {
        if (b.encry_url) {
            var d = "&actionid=" + c;
            if ("string" === typeof e)
                d += "&attach=" + e;
            else if (e) {
                e.attach = e.attach || 0;
                for (var f in e)
                    e.hasOwnProperty(f) && null != e[f] && (d += "&" + f + "=" + e[f])
            } else
                d += "&attach=0";
            d += "&time=" + (new Date).getTime();
            e = b.encry_url + d;
            if (4 === c && (b.notice_url && baidu.sio.log(b.notice_url),
                    c = b.api,
                    b = b.encry_url,
                c.version && !("1.0.1" > c.version) && (c.recordTime("showed", (new Date).getTime()),
                    d = c.getRecordedTime()))) {
                f = 0;
                for (var g = d.length; f < g; f++) {
                    var l = d[f];
                    b += "&" + l.type + "=" + l.time
                }
                b += "&render=" + encodeURIComponent(c.getRenderUrl());
                b += "&union_id=" + c.getLoaderConfig("unionId", "");
                b = b + "&actionid=8" + a.v;
                baidu.sio.log(b)
            }
            e += a.v;
            baidu.sio.log(e)
        }
    }
    ta.prototype.attachTo = function(a) {
        var b = this;
        a.addListener("aftermaterialshow", function() {
            var c = a.adConfig
                , e = c.api;
            e.version && "1.0.6" <= e.version && (b.v = "&exp_list=" + (c.exp_list || "") + "&render_id=" + e.getRenderId(),
                e.addListener("clickimg", function() {
                    va(b, c, 12)
                }));
            va(b, c, 4)
        });
        a.addListener(z, function(c, e) {
            c.actionid && (e = {
                attach: c.attach,
                stage: c.stage
            },
                c = c.actionid);
            va(b, a.adConfig, c, e)
        })
    }
    ;
    function wa() {}
    wa.prototype.s = baidu.abstractMethod;
    wa.prototype.A = baidu.abstractMethod;
    function O(a) {
        this.N = baidu.object.extend({
            block_class: I("ad-layout-block")
        }, a || {})
    }
    baidu.inherits(O, wa);
    O.prototype.s = function(a) {
        var b = xa(this, a)
            , c = {};
        C(a, function(a, b) {
            var f = a.getMainHtml();
            c["block-" + b.join("-") + "-id"] = a.getId();
            c["block_" + b.join("_")] = f
        });
        return Mustache.render(b, c)
    }
    ;
    O.prototype.A = function(a, b) {
        C(a, function(a, e) {
            for (var d = b, f = 0; d && f < e.length; f++)
                d = d.children[e[f]];
            if (!d)
                throw Error("Invalid pre-rendered html formated.");
            a.t = d.id
        })
    }
    ;
    function xa(a, b) {
        var c = [];
        baidu.each(b, function(b, d) {
            c.push(ya(a, b, [d]))
        });
        return c.join("\n")
    }
    function ya(a, b, c) {
        var e = ">";
        baidu.lang.isArray(b) || (e = ' id="{{=<% %>=}}{{block-<% indexes %>-id}}">');
        var d = [Mustache.render('<div class="{{block_class}} {{block_class}}-{{indexes}}"' + e, {
            block_class: I(a.N.block_class),
            indexes: c.join("-")
        })];
        baidu.lang.isArray(b) ? baidu.each(b, function(b, e) {
                d.push(ya(a, b, c.concat([e])))
            }) : d.push("{{{block_" + c.join("_") + "}}}");
        d.push("</div>");
        return d.join("\n")
    }
    ;function za() {
        this.H = {}
    }
    za.prototype.get = function(a) {
        return this.H[a] || ""
    }
    ;
    za.prototype.parse = function(a) {
        function b(a) {
            return p.test(a) ? b(a.replace(p, function(a, b) {
                    return R[b] || V[b] || ""
                })) : a
        }
        function c(a) {
            a && G && W.push(a)
        }
        function e() {
            G && (G in R ? alert("Template: " + G + " is exist") : R[G] = W.join("\n"));
            G = null
        }
        a = a.split(/\r?\n/);
        for (var d = a.length, f = 0, g = /\x3c!--\s*target:\s*([a-zA-Z0-9_]+)\s*--\x3e/, l = /\x3c!--\s*\/target\s*--\x3e/, p = /\x3c!--\s*import:\s*([a-zA-Z0-9_\/]+)\s*--\x3e/, n = /\x3c!--\s*scope:\s*([a-zA-Z0-9_]+)\s*--\x3e/, h = /\x3c!--\/scope--\x3e/, k, m, y, D, V = this.H, W = [], G, R = {}; f < d; f++)
            m = a[f],
            0 >= m.length || (g.lastIndex = -1,
                n.lastIndex = -1,
                (y = n.exec(m)) ? D = y[1] : (y = h.exec(m)) ? D = void 0 : (y = g.exec(m)) ? (y = D ? D + "/" + y[1] : y[1],
                                m = m.split(g),
                                c(m[0]),
                                e(),
                                W = [],
                                G = y,
                                c(m[2])) : l.test(m) ? (m = m.split(l),
                                    c(m[0]),
                                    e()) : c(m));
        e();
        for (k in R)
            V[k] && alert("Template: " + k + " already exists!"),
                V[k] = b(R[k])
    }
    ;
    var Aa = new za;
    function Ba() {}
    ;function P() {
        this.b = {}
    }
    baidu.inherits(P, Ba);
    P.prototype.addListener = function(a, b) {
        this.b[a] || (this.b[a] = []);
        this.b[a].push(b)
    }
    ;
    P.prototype.dispose = function() {
        this.b = {}
    }
    ;
    P.prototype.trigger = function(a, b) {
        if (!this.b[a])
            return !0;
        var c, e = Array.prototype.slice.call(arguments, 1), d = !0;
        for (c = 0; c < this.b[a].length; c++) {
            var f = this.b[a][c];
            f && !1 === f.apply(this, e) && (d = !1)
        }
        return d
    }
    ;
    var Ca;
    function Q(a) {
        this.b = {};
        this.t = "w-" + Math.floor(2147483648 * Math.random()).toString(36);
        this.O = this.L = null;
        this.setData(a)
    }
    baidu.inherits(Q, P);
    Ca = function(a, b) {
        return Mustache.render(a, b)
    }
    ;
    Q.prototype.trigger = function(a, b) {
        if (!this.b[a])
            return !0;
        var c;
        c = this.b[a].length;
        var e = Array.prototype.slice.call(arguments, 1)
            , d = !0;
        for (c -= 1; 0 <= c; c--) {
            var f = this.b[a][c];
            if (f && !1 === f.apply(this, e)) {
                d = !1;
                break
            }
        }
        return d
    }
    ;
    Q.prototype.getMainHtml = function() {
        if (!this.w || !this.a)
            throw Error("Widget's view and data can not be undefined.");
        var a = this
            , b = Aa.get(this.w)
            , c = baidu.extend(this.a, {
            _id: function() {
                return function(b) {
                    return a.getId(b)
                }
            },
            _mixup: function() {
                return function(a) {
                    return I(a)
                }
            }
        });
        return Ca(b, c)
    }
    ;
    q = Q.prototype;
    q.render = function() {
        var a = this.getRoot();
        if (a) {
            var b = this.getMainHtml();
            a.innerHTML = b
        }
    }
    ;
    q.init = baidu.fn.blank;
    q.k = baidu.fn.blank;
    q.p = baidu.fn.blank;
    q.getData = function(a, b) {
        if (a) {
            var c = B(a, this.a);
            return null == c && "undefined" !== typeof b ? b : c
        }
        return this.a
    }
    ;
    q.setData = function(a) {
        a && (this.a = baidu.object.extend(this.Y || {}, a));
        this.r()
    }
    ;
    q.r = function() {}
    ;
    Q.prototype.getRoot = function() {
        return this.getDocument().getElementById(this.getId())
    }
    ;
    Q.prototype.getDocument = function() {
        var a;
        if (!(a = this.L)) {
            if (a = this.O) {
                for (var b = {}, c = ["getElementById"], e = ["createElement", "createDocumentFragment", "createTextNode", "createAttribute"], d = 0; d < c.length; d++) {
                    var f = c[d];
                    b[f] = baidu.fn.bind(a[f], a)
                }
                for (d = 0; d < e.length; d++)
                    f = e[d],
                        b[f] = baidu.fn.bind(document[f], document);
                a = b
            } else
                a = null;
            a = a || document
        }
        return a
    }
    ;
    Q.prototype.getId = function(a) {
        return a ? this.t + "-" + a : this.t
    }
    ;
    Q.prototype.show = function() {
        var a = this.getRoot();
        a && baidu.show(a)
    }
    ;
    Q.prototype.hide = function() {
        var a = this.getRoot();
        a && baidu.hide(a)
    }
    ;
    Q.prototype.sendLog = function(a, b) {
        baidu.lang.isString(a) ? this.trigger(z, {
                action: a,
                xp: b || a
            }) : this.trigger(z, a)
    }
    ;
    Q.prototype.dispose = function() {
        var a = this.getRoot();
        a && (a.innerHTML = "",
            a.parentNode.removeChild(a));
        Q.superClass.dispose.call(this)
    }
    ;
    function S(a, b) {
        Q.call(this, a);
        this.j = new O({
            block_class: "ad-block"
        });
        this.d = [];
        this.R = b || ""
    }
    baidu.inherits(S, Q);
    S.prototype.setWidgets = function(a) {
        this.d = [].slice.call(arguments)
    }
    ;
    S.prototype.getWidget = function(a) {
        var b = Array.prototype.slice.call(arguments);
        if (!b.length)
            return null;
        var c = this.d[b[0]];
        if (!c)
            return null;
        for (var e = 1; e < b.length; e++)
            if (c = c[b[e]],
                null == c)
                return null;
        return c
    }
    ;
    S.prototype.getMainHtml = function() {
        this.a._content = this.j.s(this.d);
        return S.superClass.getMainHtml.call(this)
    }
    ;
    S.prototype.forEach = function(a) {
        C(this.d, a)
    }
    ;
    function Da(a, b) {
        b.addListener(z, function(b) {
            b.action = (a.R || "") + b.action;
            a.sendLog(b)
        })
    }
    S.prototype.init = function() {
        this.forEach(function(a) {
            a.init()
        })
    }
    ;
    S.prototype.k = function() {
        this.forEach(function(a) {
            a.k()
        })
    }
    ;
    S.prototype.p = function() {
        this.forEach(function(a) {
            a.p()
        });
        var a = this;
        this.forEach(function(b) {
            Da(a, b)
        })
    }
    ;
    S.prototype.dispose = function() {
        this.forEach(function(a) {
            a.dispose()
        })
    }
    ;
    function Ea(a) {
        a.real_url = a.target_url || a.encry_url + "&actionid=2&attach=0";
        var b;
        (b = a.adlist) && 0 < b.length && baidu.array.each(b, function(b) {
            b.real_url = b.target_url || a.real_url
        })
    }
    function Fa(a, b) {
        var c = a.getRoot();
        c && (Ga(c, a, b),
            Ha(c, a),
            Ia(a),
            baidu.array.each(c.getElementsByTagName("iframe"), function(c) {
                if (a.getData("box.third_party_content", !1))
                    a.addListener("load", function(d) {
                        d = d || c.contentDocument || c.contentWindow.document;
                        baidu.on(d.body, "click", function(c) {
                            c = baidu.event.getTarget(c);
                            (c = Ja(c, d.body)) && a.trigger(z, {
                                actionid: 2,
                                attach: 0 + b()
                            })
                        });
                        Ha(d.body, a)
                    });
                else {
                    var d = c.contentDocument || c.contentWindow.document;
                    Ga(d.body, a, b);
                    Ha(d.body, a)
                }
            }))
    }
    function Ga(a, b, c) {
        var e = b.getData("adlist");
        if (e && e.length && e[0].target_url || b.getData("target_url"))
            baidu.on(a, "click", function(d) {
                for (var e = baidu.event.getTarget(d); baidu.dom.contains(a, e) && !baidu.getAttr(e, "data-log"); )
                    e = e.parentNode;
                baidu.dom.contains(a, e) && (d = baidu.getAttr(e, "data-log")) && (e = baidu.getAttr(e, "data-attach"),
                ("1" !== e + "" || b.K) && b.trigger(z, {
                    actionid: parseInt(d, 10),
                    attach: (e || 0) + c()
                }))
            });
        else
            e = function(b) {
                b = baidu.event.getTarget(b);
                if ((b = Ja(b, a)) && baidu.getAttr(b, "data-log")) {
                    var e = b.href;
                    e && (b.href = e.replace(/&attach=([^|]+)(?:\|[^$&]*)?$/, function(a, b) {
                        return "&attach=" + b + c()
                    }))
                }
            }
                ,
                baidu.on(a, "mousedown", e),
                baidu.on(a, "mouseup", e)
    }
    function Ja(a, b) {
        if (!baidu.dom.contains(b, a))
            return null;
        for (var c = a; c && "A" !== c.nodeName; ) {
            if (c === b)
                return null;
            c = c.parentNode
        }
        return c
    }
    function Ha(a, b) {
        if (!("1.0.6" > b.getData("api").version))
            baidu.on(a, "click", function(c) {
                c = baidu.event.getTarget(c);
                (c = Ja(c, a)) || b.trigger(z, {
                    actionid: 11
                })
            })
    }
    function Ia(a) {
        var b = a.getData("api")
            , c = 0.01 > Math.random();
        if (!("1.0.6" > b.version) && c) {
            var e = 0, d, f, g = function() {
                d && f && (e += f - d);
                f = d = null
            };
            b.addListener("mousemove", function() {
                d || (d = new Date);
                f = new Date
            });
            b.addListener("mouseout", g);
            var l = 0, p, n, h = function() {
                p && (n = new Date,
                    l += n - p);
                n = p = null
            };
            b.inView() && (p = new Date);
            b.addListener("intoview", function() {
                p || (p = new Date)
            });
            b.addListener("outview", h);
            var k = function() {
                g();
                h();
                a.trigger(z, {
                    actionid: 13,
                    attach: e + "_" + l
                })
            };
            b.addListener("release", function() {
                k();
                var a = window
                    , b = "unload";
                "string" === typeof a && (a = document.getElementById(a));
                for (var b = b.replace(/^on/i, "").toLowerCase(), c = v.length, e = !k, d, f; c--; )
                    d = v[c],
                    d[1] !== b || d[0] !== a || !e && d[2] !== k || (f = d[4],
                        d = d[3],
                        a.removeEventListener ? a.removeEventListener(f, d, !1) : a.detachEvent && a.detachEvent("on" + f, d),
                        v.splice(c, 1))
            });
            ga(window, "unload", k)
        }
    }
    ;function U() {}
    baidu.inherits(U, wa);
    U.prototype.s = function(a) {
        var b = [];
        C(a, function(a) {
            b.push(Ka(a.getMainHtml(), a.getId()))
        });
        return b.join("")
    }
    ;
    function Ka(a, b) {
        return a.replace(/(<[a-z][^>]*?)(?:(id=['"][_\-a-z0-9]+['"])([^>]*?))?(>)/i, function(a, e, d, f, g) {
            return e + (d ? "" : " ") + 'id="' + b + '"' + (f || "") + g
        })
    }
    U.prototype.A = function(a, b) {
        var c = 0;
        C(a, function(a) {
            var d = b.children[c];
            if (!d)
                throw Error("Invalid pre-rendered html formated.");
            c++;
            a.t = d.id
        })
    }
    ;
    function X(a) {
        this.o = null;
        this.D = 0;
        this.P = " white none none-white none-white-2 v2 configurable".split(" ");
        Q.call(this, a);
        this.w = "AD_ad_widget_imageplus_sticker_box";
        this.j = new U;
        this.h = this.l = this.K = !1;
        this.d = [];
        this.n = null
    }
    baidu.inherits(X, S);
    X.prototype.r = function() {
        if (this.a) {
            Ea(this.a);
            var a = this.P[this.getData("box.theme", 0)];
            a && (this.a.box._theme_class = I("ad-widget-imageplus-sticker-theme-" + a))
        }
    }
    ;
    X.prototype.k = function() {
        function a() {
            d.h || (k && (F(k),
                k = null,
                d.l = !1),
            m && (F(m),
                m = null,
                d.l = !1),
            d.l || (d.show(),
                d.o = new Date,
                d.trigger(z, 1)))
        }
        function b() {
            d.h || (d.hide(),
            d.o && (d.D++,
                d.trigger(z, {
                    actionid: 3,
                    attach: (new Date - d.o) / 1E3
                })))
        }
        function c() {
            0 < D ? m = na(b, D) : b()
        }
        function e(a) {
            d.h || k || m || (d.show(),
                k = na(function() {
                    d.hide();
                    k = null
                }, a ? h : n))
        }
        X.superClass.k.call(this);
        var d = this
            , f = d.getRoot();
        d.getData("box.is_cut_show") && (baidu.dom.addClass(f, I("ad-widget-imageplus-sticker-cut")),
            baidu.dom.setStyle(f, "height", d.getData("box.cut_height", 75)));
        var g = d.getData("api");
        La(d);
        d.forEach(function(a) {
            a.addListener("resize", function() {
                Ma(d, g.getImgRect().height)
            });
            a.addListener("load", function() {
                d.trigger("load")
            })
        });
        var l;
        if (f = d.getData("box.hide_close_btn", !1))
            l = baidu.g(d.getId("close")),
                baidu.hide(l);
        f && (f = function() {
            baidu.show(l)
        }
            ,
            g.addListener("mouseover", f),
            g.addListener("mousemove", f),
            g.addListener("mouseout", function() {
                baidu.hide(l)
            }));
        d.h = g.getShareData("[impl.sticker]forceHiding", !0) || !1;
        g.addListener("resize", function(a, b) {
            d.l && Ma(d, b.height)
        });
        g.addListener("onclose", function() {
            d.h = !0;
            d.trigger(z, 5)
        });
        var p = d.getData("box.show_thumbnail", !1);
        d.addListener("onclose", function(a) {
            d.h = !0;
            if (p) {
                var b = baidu.g(d.getId("thumbnail"));
                b && baidu.show(b)
            }
            g.setShareData("[impl.sticker]forceHiding", !0);
            d.trigger(z, {
                actionid: 3,
                attach: (new Date - d.o) / 1E3
            });
            d.trigger(z, {
                actionid: 5,
                attach: a
            })
        });
        var f = d.getData("box.always_show", !1), n = d.getData("box.first_show_time", 5E3), h = d.getData("box.show_in_view", 0), k, m, y = d.getData("box.title_show", !1), D = d.getData("box.hide_delay", 0);
        f ? setTimeout(a, 0) : y ? (Na(d),
                    g.addListener("mouseout", c),
                    f = x.g(d.getId("wrapper")),
                    ga(f, "mouseover", function() {
                        a()
                    })) : (g.addListener("mouseover", a),
                    g.addListener("mousemove", a),
                    g.addListener("mouseout", c),
                h && g.addListener("intoview", e),
                    e());
        g.rendDone({
            showTip: d.getData("box.imageplus_button", !0),
            useV2Tip: d.getData("box.use_v2_tip", !1)
        })
    }
    ;
    X.prototype.p = function() {
        var a = this;
        X.superClass.p.call(a);
        Fa(a, function() {
            return "|" + (new Date - a.o) / 1E3 + "|" + a.D
        });
        var b = baidu.g(a.getId("close"));
        if (b) {
            var c = a.getData("box.use_v2_tip", !1);
            baidu.on(b, "click", function(b) {
                baidu.event.preventDefault(b || window.event);
                c ? a.getData("api").closeAd({
                        canvas: "me"
                    }) : (a.hide(!0),
                        a.trigger("onclose"))
            })
        }
        if (a.getData("box.show_thumbnail", !1) && (b = baidu.g(this.getId("thumbnail"))))
            baidu.on(b, "click", function(b) {
                a.h = !1;
                a.trigger(z, 1);
                baidu.event.preventDefault(b);
                a.show();
                (b = baidu.g(a.getId("thumbnail"))) && baidu.hide(b)
            })
    }
    ;
    function Oa(a) {
        var b = baidu.g(a.getId("wrapper"));
        a = a.getRoot();
        return b || a
    }
    X.prototype.show = function() {
        if (this.getRoot()) {
            var a = this.getData("api");
            a && Ma(this, a.getImgRect().height);
            var b = this;
            b.getData("box.hide_close_btn", !1) || (this.n && F(this.n),
                this.n = na(function() {
                    var a = baidu.g(b.getId("close"));
                    a && baidu.show(a);
                    this.n = null
                }, 500));
            baidu.dom.addClass(Oa(this), I("ad-widget-imageplus-sticker-showing ad-widget-imageplus-sticker-box-showing"));
            this.l = !0
        }
    }
    ;
    X.prototype.hide = function(a) {
        var b = !0 === a;
        if (a = Oa(this)) {
            var c = this.getData("api")
                , e = this.getData("box.visual_height", 0)
                , d = this.getData("box.cut_height", 75);
            b && (e = 0,
                baidu.dom.removeClass(a, I("ad-widget-imageplus-sticker-box-showing")));
            c && (this.getData("box.is_cut_show") ? baidu.setStyle(a, "top", d - e + "px") : baidu.setStyle(a, "top", c.getImgRect().height - e + "px"));
            baidu.setStyle(a, "height", e + "px");
            0 >= e && baidu.browser.ie && 10 > baidu.browser.ie && (a.style.cssText = "");
            this.n && F(this.n);
            (b = baidu.g(this.getId("close"))) && baidu.hide(b);
            baidu.dom.removeClass(a, I("ad-widget-imageplus-sticker-showing"));
            this.l = !1
        }
    }
    ;
    function Ma(a, b) {
        var c = a.getRoot()
            , e = Oa(a);
        if (a.getData("box.is_cut_show")) {
            var d = a.getData("box.cut_height", 75);
            if (e) {
                e.style.cssText = "clip:rect(0px,0px,0px,0px);display:block;height:0;top:" + b + "px;";
                var f = baidu.g(a.getId("body"))
                    , f = f.offsetHeight;
                e.style.cssText = "display:block;top:" + (d - f) + "px;height:" + f + "px;"
            }
            c && a.getData("box.is_cut_show") && (c.style.cssText = "display:block;top:" + (b - d) + "px;height:" + d + "px;")
        } else
            e && (e.style.cssText = "clip:rect(0px,0px,0px,0px);display:block;height:0;top:" + b + "px;",
                f = baidu.g(a.getId("body")),
                f = f.offsetHeight,
                e.style.cssText = "display:block;top:" + (b - f) + "px;height:" + f + "px;");
        if (c = baidu.g(a.getId("thumbnail")))
            c.style.top = b - 20 + "px"
    }
    function La(a) {
        var b = baidu.g(a.getId("background"));
        b && (a = a.getData("box.box_bg_opacity", 0.75),
            x.opacity(b, a))
    }
    function Na(a) {
        var b = a.getData("box.visual_height", 0)
            , c = Oa(a)
            , e = a.getData("box.cut_height", 75);
        if (c) {
            var d = a.getData("api");
            d && (Ma(a, d.getImgRect().height),
                baidu.setStyle(c, "top", e - b + "px"))
        }
        (a = baidu.g(a.getId("close"))) && baidu.hide(a)
    }
    ;var Pa = {
        getContext: function(a) {
            return B("ECOM_MA_LEGO.materials." + a)
        },
        ca: function(a) {
            a = a || Pa.getId();
            return (a = Pa.getContext(a)) ? a.material || null : null
        },
        getId: function() {
            var a = "canvas";
            "undefined" != typeof RT_CONFIG && RT_CONFIG.id ? a = RT_CONFIG.id : "undefined" != typeof AD_CONFIG && AD_CONFIG.id && (a = AD_CONFIG.id);
            return a
        },
        Z: function(a) {
            var b = ("ECOM_MA_LEGO.materials." + a.material.getId()).split(".")
                , c = window;
            b[0]in c || !c.execScript || c.execScript("var " + b[0]);
            for (var e; b.length && (e = b.shift()); )
                b.length || void 0 === a ? c = c[e] ? c[e] : c[e] = {} : c[e] = a
        },
        da: function(a) {
            var b = a.getRoot();
            for (a = document; b && b != a; ) {
                if (baidu.dom.hasAttr(b, "data-rendered"))
                    return b.id;
                b = b.parentNode
            }
            return null
        }
    };
    function Y(a) {
        S.call(this, {});
        this.j = new O({
            block_class: I("ad-block")
        });
        this.f = a || Pa.getId();
        this.F = "s-" + this.f;
        this.c = {};
        if ("undefined" !== typeof RT_CONFIG && (a = RT_CONFIG.__plugins) && a.length)
            for (var b = 0; b < a.length; b++)
                a[b].attachTo(this);
        this.I = (this.I || []).concat(["newadcanvas"])
    }
    baidu.inherits(Y, S);
    Y.prototype.getRoot = function() {
        if (!baidu.g(this.f)) {
            var a = RT_CONFIG.originId;
            a && baidu.g(a) ? baidu.g(a).id = this.f : document.write('<div id="' + this.f + '"></div>')
        }
        return baidu.g(this.f)
    }
    ;
    Y.prototype.getId = function() {
        return this.f
    }
    ;
    function Qa(a) {
        if ("undefined" !== typeof AD_STYLE_CONTENT) {
            var b = AD_STYLE_CONTENT.replace(/#canvas/g, "#" + a.f)
                , c = baidu.g(a.F);
            if (c)
                c.styleSheet ? c.styleSheet.cssText = b : c.textContent = b;
            else {
                c = a.F;
                a = a.getRoot();
                var e = x.m
                    , d = a.parentNode;
                if (d) {
                    var f = e.createElement("style");
                    f.type = "text/css";
                    f.media = "screen";
                    c && (f.id = c);
                    d.insertBefore(f, a);
                    f.styleSheet ? f.styleSheet.cssText = b : f.appendChild(e.createTextNode(b))
                }
            }
        }
    }
    Y.prototype.getMainHtml = function() {
        var a = this.j.s(this.d);
        return '<div class="' + I("layout") + '">' + a + "</div>"
    }
    ;
    Y.prototype.beforeShow = function() {
        try {
            "string" === typeof AD_STYLE_CONTENT && (AD_STYLE_CONTENT = I(AD_STYLE_CONTENT, "css")),
                this.trigger("beforematerialshow")
        } catch (a) {}
    }
    ;
    Y.prototype.init = function() {
        var a = this;
        this.forEach(function(b) {
            baidu.each(a.I, function(c) {
                b.addListener(c, function() {
                    var b = [].slice.call(arguments, 0);
                    b.unshift(c);
                    a.trigger.apply(a, b)
                })
            })
        });
        var b = this.getRoot();
        if (b) {
            if ("string" === typeof AD_TEMPLATE_CONTENT && /AD_ad_widget_siva_/.test(AD_TEMPLATE_CONTENT))
                try {
                    this.j.A(this.d, b.children[0])
                } catch (c) {
                    b.innerHTML = this.getMainHtml()
                }
            else
                b.innerHTML = this.getMainHtml();
            b.setAttribute("data-rendered", "true")
        }
        Y.superClass.init.call(this)
    }
    ;
    Y.prototype.show = function() {
        this.beforeShow();
        Qa(this);
        this.init();
        this.k();
        this.p();
        baidu.show(this.getId());
        try {
            this.trigger("aftermaterialshow")
        } catch (a) {}
        var b = this;
        H(function() {
            b.dispose()
        })
    }
    ;
    Y.prototype.trigger = function(a, b) {
        var c = [].slice.call(arguments, 0);
        this.c = this.c || {};
        this.c[a] || (this.c[a] = []);
        this.c[a].push(c.slice(1));
        return Y.superClass.trigger.apply(this, c)
    }
    ;
    Y.prototype.addListener = function(a, b, c) {
        Y.superClass.addListener.call(this, a, b);
        if (c)
            for (this.c = this.c || {},
                     a = this.c[a] || [],
                     c = 0; c < a.length; c++)
                b.apply(this, a[c])
    }
    ;
    Y.prototype.dispose = function() {
        Y.superClass.dispose.call(this);
        var a = baidu.g(this.getId());
        a && (a.innerHTML = "");
        this.c = null
    }
    ;
    function Ra(a) {
        Y.call(this, a);
        this.j = new U
    }
    baidu.inherits(Ra, Y);
    Ra.prototype.getMainHtml = function() {
        return this.j.s(this.d)
    }
    ;
    function Sa(a) {
        Q.call(this, a)
    }
    baidu.inherits(Sa, Q);
    Sa.prototype.r = function() {
        if (this.a) {
            Ea(this.a);
            var a = this.a;
            a.trade_id = {
                    1: "medical",
                    2: "tourism",
                    3: "machine",
                    4: "photo",
                    5: "decoration",
                    6: "game"
                }[a.trade_id] || "default"
        }
    }
    ;
    Sa.prototype.g = function(a) {
        return "string" === typeof a || a instanceof String ? this.getDocument().getElementById(a) : a && a.nodeName && (1 === a.nodeType || 9 === a.nodeType) ? a : null
    }
    ;
    var Ta;
    Ta = function(a, b, c) {
        var e, d, f = a.length;
        if ("function" === typeof b)
            for (d = 0; d < f && (e = a[d],
                e = b.call(c || a, e, d),
            !1 !== e); d++)
                ;
    }
    ;
    function Z(a) {
        Q.call(this, a);
        this.w = "AD_ad_widget_imageplus_sticker_pa_links_new"
    }
    baidu.inherits(Z, Sa);
    Z.prototype.r = function() {
        Z.superClass.r.apply(this, arguments);
        if (this.a) {
            var a = [];
            if (this.a.esturl)
                Ta(this.a.esturl, function(b, e) {
                    a[e] = {
                        title: la(b.sub_tit, 12),
                        url: b.sub_url
                    }
                });
            else if (this.a.sturl) {
                var b = this.getData("real_url");
                Ta(this.a.sturl, function(c, e) {
                    a[e] = {
                        title: la(c, 12),
                        url: b
                    }
                })
            }
            this.a._urls = a;
            this.a.box.background_color = this.getData("box.pa.background_color", "");
            this.a.box.pa && (this.a.box.box_bg_opacity = 0.9)
        }
    }
    ;
    Z.prototype.k = function() {
        Z.superClass.k.call(this);
        var a = this
            , b = this.getData("api");
        if (!this.a.sturl && b) {
            var c = b.getImgRect();
            Ua(this, c.width);
            b.addListener("resize", function(b, c) {
                Ua(a, c.width)
            })
        }
        Va(a);
        a.getData("box.big_img", !1) && Wa(a);
        Xa(a)
    }
    ;
    function Ua(a, b) {
        var c = parseInt((b - 169) / 13 * 4, 10) + 4
            , c = la(a.getData("desc", ""), c);
        a.g(a.getId("desc")).innerHTML = c
    }
    function Va(a) {
        function b() {
            0 === Math.floor(c / 4) % 5 && (e.style.cssText = c % 2 ? "top:20px" : "top:16px");
            c++
        }
        var c = 0
            , e = a.g(a.getId("lookbtnshake"))
            , d = setInterval(b, 100);
        e.onmouseover = function() {
            d = clearInterval(d);
            e.style.cssText = "top:20px"
        }
        ;
        e.onmouseout = function() {
            d = setInterval(b, 100)
        }
    }
    function Wa(a) {
        var b = a.getData("api");
        a = a.getRoot();
        var c = baidu.dom.q("baiduimageplus-s-pa-bd", a)[0];
        baidu.dom.setAttr(c, "style", "overflow:visible;");
        b.addListener("mouseover", function() {
            baidu.dom.setAttr(c, "style", "overflow:visible;")
        });
        b.addListener("mouseout", function() {
            baidu.dom.setAttr(c, "style", "overflow:hidden;")
        });
        setTimeout(function() {
            baidu.dom.setAttr(c, "style", "overflow:hidden;")
        }, 5E3)
    }
    function Xa(a) {
        var b = a.g(a.getId("baidu-adstext"))
            , c = a.g(a.getId("baidu-adslogo"));
        ga(b, "mouseenter", function() {
            c.style.cssText = "display: block"
        })
    }
    ;(function(a) {
        Aa.parse(I(AD_TEMPLATE_CONTENT, "template"));
        try {
            window.__ignore = document.getElementById("whatever")
        } catch (b) {}
        "function" === typeof ECMA_define ? ECMA_define(function() {
                return new N(a)
            }) : a()
    })(function(a, b) {
        var c = b || {};
        return function() {
            var b, d, f = AD_CONFIG;
            c.before && c.before(f);
            b = new Ra(f.id);
            b.adConfig = f;
            d = new X(f);
            d.setWidgets([new a(f)]);
            b.setWidgets([d]);
            b.show();
            c.after && c.after(f, d);
            return b
        }
    }(Z));

})(/** AD_CONFIG */
    {}, /** LINKS */
    [], /** RT_CONFIG */
    {});
//Tue Dec 27 2016 12:12:49 GMT+0800 (CST)
