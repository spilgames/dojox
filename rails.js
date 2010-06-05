dojo.provide("dojox.rails");
dojo.require("dojo.NodeList-traverse");

dojo.ready((function(d, dr, dg){
	return function() {
		var q = d.query,
				csrfToken = q("meta[name=csrf-token]").attr("content"),
		    csrfParam = q("meta[name=csrf-param]").attr("content");

		var live = function(selector, evtName, fn){
			d.connect(d.body(), evtName, function(evt){
				var nl = q(evt.target).closest(selector);
				if (nl.length){
					fn.call(nl[0], evt);
				}
			});
		};

		var createFormForLink = function(url, method){
			var form = '<form style="display:none" method="POST" action="'+ url +'">' +
				'<input type="hidden" name="_method" value="'+ method +'" />' +
				'<input type="hidden" name="'+ csrfParam +'" value="'+ csrfToken +'" />' +
				'</form>';
			return dojo.place(form, dojo.body());
		};

		var handleConfirm = function(evt){
			var proceed = dg.confirm(d.attr(evt.target, "data-confirm"));
			if (!proceed){evt.preventDefault();}
			return proceed;
		};

		var disable = function(elements){
			d.forEach(elements, function(node){
				if (!d.attr(node, "disabled")){
					var attr = node.tagName.toLowerCase() == "input" ? "value" : "innerHTML";
					var message = d.attr(node, "data-disable-with");
					var originalValue = d.attr(node, attr);
					d.attr(node, "disabled", true);
					d.attr(node, "data-original-value", originalValue);
					d.attr(node, attr, message);
				};
			});
		};

		var handleRemote = function(evt){
			var el = evt.target, type = d.attr(el, "data-type") || "javascript";

			var method, url, content;
			if (el.tagName.toUpperCase() == "FORM"){
				url = d.attr(el, "action");
				method = (d.attr(el, "method") || "POST").toUpperCase();
				content = d.formToObject(el);
			}else{
				url = d.attr(el, "href");
				method = (d.attr(el, "data-method") || "GET").toUpperCase();
				content = {};
				if (method != "GET"){
					el = createFormForLink(url, method);
					method = "POST";
				}
			}

			// ajax:loading, ajax:loaded, and ajax:interactive are not supported
			d.publish("ajax:before", [el]);
			evt.preventDefault();
			var deferred = d.xhr(method, {
				url:      url,
				headers:  { "Accept": "text/"+type },
				content:  content,
				handleAs: type,
				load:		  function(response, ioArgs) { d.publish("ajax:success",	[el, response, ioArgs]); },
				error:	  function(response, ioArgs) { d.publish("ajax:failure",	[el, response, ioArgs]); },
				handle:   function(response, ioArgs) { d.publish("ajax:complete", [el, response, ioArgs]); }
			});
			d.publish("ajax:after", [el]);
		};


		var handleEnable	= function(el){
			q("*[data-disable-with][disabled]", el).forEach(function(node){
				var attr = node.tagName.toLowerCase() == "input" ? "value" : "innerHTML";
				var value = d.attr(node, "data-original-value");
				d.attr(node, "disabled", false);
				d.attr(node, "data-original-value", null);
				d.attr(node, attr, value);
			});
		};

		var handleDataMethod = function(evt){
			var el = evt.target, form = createFormForLink(el.href, dojo.attr(el, "data-method"));
			evt.preventDefault();
			form.submit();
		};

		var handleFormSubmit = function(evt){
			var el = evt.target, disableElements = q("*[data-disable-with]", el);
			if (disableElements.length){ disable(disableElements); }
			if (d.attr(el, "data-remote")){
				evt.preventDefault();
				handleRemote(evt);
			}else{
				el.submit();
			}
		};

		// Register data-{action} elements.	 Order is important since the return values
		// from previously called functions in the connect chain influence whether
		// or not the next function in the chain is called.

		// Register data-confirm elements
		live("*[data-confirm]", "click", handleConfirm);

		// data-disable-with only applies to forms
		d.subscribe("ajax:complete", handleEnable);

		// Register data-remote elements
		live("a[data-remote]", "click", handleRemote);
		live("a[data-method]:not([data-remote])", "click", handleDataMethod);

		// Handle form submits
		live("form", "submit", handleFormSubmit);
	};
})(dojo, dojox.rails, dojo.global));