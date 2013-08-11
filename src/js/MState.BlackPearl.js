/**
 * M State's Black Pearl UI project
 */

/* JQuery DOM search speed hack */
jQuery.expr[':'].contains = function(a,i,m){
	return (a.textContent || a.innerText || "").toLowerCase().indexOf(unescape(m[3]).toLowerCase())>=0; 
};

if (!MState) {
	var MState = {};
}

MState.bp = {

	cssZebra: 'bp-zebra',
	cssHighlight: 'bp-highlight',
	cssOutline: 'bp-highlight-outline',

	/**
	 * Zebra stripe odd items in the selector
	 * 
	 * @param selector JQuery selector that contains elements to apply the background to
	 */
	zebra: function(selector) {
		$(selector+':odd').addClass(MState.bp.cssZebra);
	},
	
	/**
	 * Apply a highlight mouseover event to the selector
	 * 
	 * @param selector JQuery selector that contains elements to apply the highlight effect to
	 */
	highlight: function(selector) {
		
		$(selector).mouseover(
				function() {
					$(this).addClass(MState.bp.cssHighlight);
				}
		);
		
		$(selector).mouseout(
			function() {
				$(this).removeClass(MState.bp.cssHighlight);
			}
		);
	},
	
	/**
	 * Apply an outline mouseover event to the selector
	 * 
	 * @param selector JQuery selector that contains elements to apply the outline effect to
	 */
	outline: function(selector) {
		
		$(selector).mouseover(
				function() {
					$(this).addClass(MState.bp.cssOutline);
				}
		);
		
		$(selector).mouseout(
			function() {
				$(this).removeClass(MState.bp.cssOutline);
			}
		);
	}
};

MState.bp.search = {

	cssIndicate: 'bp-zebra',

	domHide: function() {
		return function(query, dataSelector) {
			$(dataSelector+' *').show();
			if (query) {
				$(dataSelector).find(':not(:contains("'+escape(query)+'"))').hide();
			}
		};
	},

	domIndicate: function() {
		return function(query, dataSelector) {
		
			$(dataSelector+' *').removeClass(MState.bp.search.cssIndicate);
			
			if (query) {
				$(dataSelector).find(':contains("'+escape(query)+'")').addClass(MState.bp.search.cssIndicate);
			}
		};
	},
	
	ajaxLoadZone: function(targetZone) {
		return function(qry) {
			$(targetZone).load(this.rpc+'?'+qry);
		};
	},

	dom: function(dataSelector, callback) {
		
		this.data = dataSelector;
		this.callback = callback;
		
		this.search = function(query) {
			if (this.callback) {
				this.callback(query, this.data);
			}
		};
		
		this.bind = function(inputSelector, event) {
			
			var handler = this;
			
			$(inputSelector).live(
				'keyup', 
				function () {
					handler.search($(this).attr('value'));
				}
			);
		};
		
		this.unbind = function(inputSelector) {
			$(inputSelector).die(
				'keyup'
			);
		};
	},

	get: function(target, callback, wait) {
		
		this.delay = function() {
			clearTimeout(this.timer);
			
			var _this = this;
			
			this.timer = setTimeout(
				function() {
					_this.callback(_this.lastQuery);
				},
				this.ttr
			);
		},
		
		this.ttr = 300; /* Time to request: After event is stopped this long (ms), then send request 
		 				 * this keeps from sending hammering AJAX requests while an input is being typed in
		 				 */

		this.lastQuery = '',
		
		this.callback = callback;
		this.wait = wait;
		this.rpc = target;
		
		this.timer = 0,
		
		this.request = function(str) {
	
			this.lastQuery = str;
			this.delay(); /* delay so we dont hammer every keystroke */
			
			if (this.wait) { /* Call optional wait function */
				this.wait();
			}
		};

		this.bind = function(triggerSelector, filterSetSelector, event) {
			
			var handler = this;
			
			if (!event) {
				event = 'keyup';
			}
			$(triggerSelector).live(
				event,
				function() {
					var data = $(filterSetSelector).serialize();
					handler.request(data);					
				}
			);
		};
	}
};

MState.bp.tooltip = {

	globalId: 0,
	
	init: function(selector) {
		
		$(selector).live({
				
			'mouseover': function() {
				if ($(this).attr('tt-id')) {
					MState.bp.tooltip.show(
						$(this).attr('tt-id')	
					);
				} else {
					MState.bp.tooltip.build($(this));
				}
			},
			
			'mouseout': function() {
				if ($(this).attr('tt-id')) {
					MState.bp.tooltip.hide(
						$(this).attr('tt-id')	
					);
				}
			}
		});
	},
	
	build: function(id) {
		
		var text = $(id).attr('title');

		if (!text) {
			text = $(id).attr('alt');
		}

		if (text) {

			MState.bp.tooltip.globalId++;
			var tooltip = $("<div tt='"+MState.bp.tooltip.globalId+"' class='bp-tooltip'>"+text+"</div>").appendTo('body');

			$(id).attr('tt-id', MState.bp.tooltip.globalId);
			
			var w = $(tooltip).width();
			var h = $(tooltip).outerHeight();

			var t = $(id).position().top;
			var l = $(id).position().left;
			
			$(tooltip).css( {
				top: (t - h - 14),
				left: (l - 9)
			});
			
			if ($(id).attr('title')) {
				$(id).attr('title', '');
			} else if ($(id).attr('alt')) {
				$(id).attr('alt', '');
			}
			
			MState.bp.tooltip.show(MState.bp.tooltip.globalId);
		}
	},
			
	show: function(id) {
		$("div[tt="+id+"]").css({
			opacity: 1,
			visibility: 'visible',
			display: 'inline-block'				
		});
	},
	
	hide: function(id) {
		$("div[tt="+id+"]").css({
			visibility: 'hidden',
			display: 'none'
		});
	}		
};

MState.bp.dropdown = {
		
	isInitialized: false,
	
	init: function() {
		if (MState.bp.dropdown.isInitialized == true) {
			return;
		}
		
		$('body').bind('click', function(evt) {

			if (!$(evt.target).hasClass('bp-dropdown-button') && $(evt.target).closest('.bp-dropdown-menu').length == 0) {
				MState.bp.dropdown.clearAll();
			}
		});
		MState.bp.dropdown.isInitialized = true;
	},
	
	bind: function(trigger, modalize) {
		$(trigger).on('click', function(e) {
			
			var menu = $(e.target).siblings('.bp-dropdown-menu');
						
			$('.bp-dropdown-menu').not($(menu)).hide(); /* Hide all open menus that aren't this one */
			
			if (modalize && $('.bp-modal').length == 0) {
				$('body').append('<div class=\'bp-modal\'></div>');
			}
			
			if (modalize) {
				/* If menu -is- visible, it's about to be turned off, hide modal */
				if ($(menu).is(":visible")) {
					$('.bp-modal').hide();
				} else { /* If the menu isn't visible, it will be, show modal. */
					$('.bp-modal').show();
				}
			}
			
			menu.toggle();
			
		});
	},

	clearAll: function() {
		$('.bp-dropdown-menu').hide();
		$('.bp-modal').hide();
	}
};

MState.bp.dock = function(sel) {
	var e = $(sel);
	
	var initY = e.offset().top;
	var initW = e.width();
	var initH = e.height();
	
	e.css('width', initW + 'px');
	e.css('height', initH + 'px');
	e.css('zIndex', 1000);
	
	e.parent().css('height', e.css('height'));
	e.parent().css('width', e.css('width'));
	$(window).scroll(function() {

		var scrollPos = $(window).scrollTop();
		
		if (initY - scrollPos < 0) {
			
			e.css('width', initW + 'px');
			e.css('top', '0px');
			e.css('position', 'fixed');
			
		} else if (initY){
			
			e.css('top', initY + 'px');
			e.css('position', 'absolute');
		}
		
	});
};
