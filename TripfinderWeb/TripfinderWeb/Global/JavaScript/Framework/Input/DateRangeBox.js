(function()
{
	var namespace = window.createNamespace("TF.Input");
	namespace.DateRangeBox = DateRangeBox;

	function DateRangeBox(initialValue, attributes, disable, noWrap, delayChange, element, allBindings)
	{
		this._dtPickerStart = null;
		this._dtPickerEnd = null;
		this.dtBoxHelperStart = null;
		this.dtBoxHelperEnd = null;

		this.SelectedItem = ko.observable('Today') 

		

		var DateRangeItems =[
			"On",
			"On or After",
			"On or Before",
			"Between",
			"Yesterday",
			"Today",
			"Tomorrow",
			"Next Business Day",
			"Next Week",
			"Last Week",
			"This Week",
			"Next Month",
			"Last Month",
			"This Month",
			"Next Year",
			"Last Year",
			"This Year",
			"Next X Days",
			"Last X Days"
		]

		DateRangeItems = DateRangeItems.sort(function(s, t) {  
			let a = s.toLowerCase();  
			let b = t.toLowerCase();  
			if (a < b) return -1;  
			if (a > b) return 1;  
			return 0;  
		})

		this.SelectItems = ko.observable(DateRangeItems)

		namespace.BaseBox.call(this, initialValue, attributes, disable, noWrap);
		this.delayChange = delayChange;
		this.allBindings = allBindings;

		this.obNumberVsb= ko.observable(true)
		this.obStartVsb = ko.observable(true)
		this.obEndVsb = ko.observable(true)
		
		this.dateNumber = ko.observable(0)

		this.initialize.call(this);

		var timeNow = new Date()
		var nowY = timeNow.getFullYear()
		var nowM = timeNow.getMonth()
		this.today =  toISOStringWithoutTimeZone(moment(timeNow))
		this.yesterday = toISOStringWithoutTimeZone(moment(new Date(timeNow.getTime()-24*60*60*1000)))
		this.tomorrow = toISOStringWithoutTimeZone(moment(new Date(timeNow.getTime()+24*60*60*1000)))

		this.valueSubscribe();
	}

	DateRangeBox.prototype = Object.create(namespace.BaseBox.prototype);

	DateRangeBox.prototype.type = "DateRange";

	DateRangeBox.constructor = DateRangeBox;

	DateRangeBox.prototype.formatString = "L";

	DateRangeBox.prototype.pickerIconClass = "k-i-calendar";

	DateRangeBox.prototype.initialize = function()
	{
		var self = this;
		var $element = $(
			`
			<div style="width : 100%">
				<div class="input-group">
					<div
						data-bind="typeahead:{source:SelectItems,format:function(obj){return obj;},drowDownShow:true,notSort:true,selectedValue:SelectedItem}">
						<input id="dropdown" type="text" class="form-control" name="Select" data-tf-input-type="Select" data-bind="value:SelectedItem,disable:disable,style:{cursor:disable()?\'\':\'pointer\',backgroundColor:disable()?\'\':\'#fff\'}" readonly />
					</div>
					<div class="input-group-btn">
						<button type="button" class="btn btn-default btn-sharp">
							<span class="caret"></span>
						</button>
					</div>
				</div>
				<div style="width : 100%; display:flex">
					<div id="divNumber" style="padding-top:5px;flex:1" data-bind="style: { display: obNumberVsb() ? 'inline-block' : 'none'}">
						<input id="dateRangeNumber"  type="text" class="form-control" maxlength="5" data-tf-input-type=Number data-bind="value:dateNumber(), disable:disable,css:{disabled:disable},event:{keyup:numkeyup , blur:numblur}" />
					</div>
					<div id="divStartDate" style="padding-top:5px;flex:1;min-width:170px" data-bind="style: { display: obStartVsb() ? 'inline-block' : 'none'}">
						<input id="dateRangeStart"   DateRange name="StartDate" type="text" class="datepickerinput" data-tf-input-type="DateRange" data-bind="disable:disable, css:{disabled:disable}" />
					</div>
					<div id="divStartDate" style="padding-top:5px;flex:1;text-align:center" data-bind="style: { display: (obStartVsb() && obEndVsb()) ? 'inline-block' : 'none'}">
						~
					</div>
					<div id="divEndDate" style="padding-top:5px;flex:1;min-width:170px" data-bind="style: { display: obEndVsb() ? 'inline-block' : 'none'}">
						<input id="dateRangeEnd"  DateRange name="EndDate" type="text" class="datepickerinput" data-tf-input-type="DateRange" data-bind="disable:disable, css:{disabled:disable}" />
					</div>
				</div>
			</div>
			`
		);
		ko.applyBindings(this, $element[0]);
		this.$element = $element

		this.$elementSelect = $element.find('#dropdown')
		this.$elementNumber = $element.find('#dateRangeNumber')
		this.$elementStartDate = $element.find('#dateRangeStart')

		this.$elementEndDate = $element.find('#dateRangeEnd')


		this.$elementSelect.addClass("dropdown-list");
		this.$elementSelect.on("click", function(e)
		{
			if (!self.disable())
				$(e.currentTarget.parentElement).closest('.input-group').find('.caret:eq(0)').parent().click();
		});



		this.$elementSelect.on("change", function(e)
		{
			var selected = e.currentTarget.value 
			self.setDateRange(selected,true)
		});
	};


	DateRangeBox.prototype.resetValidate = function(text)
	{
		var validateDivs = this.$element.parents().closest('.form-group').find('.help-block'),

			StartErrorDiv = $(validateDivs[0]),
			EndErrorDiv = $(validateDivs[1])
	
			StartErrorDiv.css("display","none")
			EndErrorDiv.css("display","none")

		if(!text && text === "")
		{
			StartErrorDiv.text("Start Date is required")
			EndErrorDiv.text("End Date is required")
		}
		else
		{
			StartErrorDiv.text(text)
			EndErrorDiv.text(text)
		}
	}


	DateRangeBox.prototype.setDateRange = function(dtype,isUpdate)
	{
		var value = {}
		if(isUpdate)
		{
			value = this.value()
		}

		this.resetValidate('')

		switch(dtype)
		{
			case 'On':
				this.setVisable(false,true,false)
				value.StartDate = this.today 
				value.EndDate = this.today
				this.resetValidate("Date value is required")
				break
			case 'On or After':
				this.setVisable(false,true,false)
				value.StartDate = this.today
				value.EndDate = '[MaxDate]'
				this.resetValidate("Date value is required")
				break
			case "On or Before":
				this.setVisable(false,false,true)
				value.StartDate = '[MinDate]'
				value.EndDate = this.today
				this.resetValidate("Date value is required")
				break
			case "Between":
				this.setVisable(false,true,true)
				value.StartDate = this.today
				value.EndDate = this.today
				break
			case "Yesterday":
				this.setVisable(false,false,false)
				value.StartDate = '[Yesterday]'//this.yesterday
				value.EndDate = '[Yesterday]'//this.yesterday
				break
			case "Today":
				this.setVisable(false,false,false)
				value.StartDate = '[Today]'//this.today
				value.EndDate = '[Today]' //this.today
				break
			case "Tomorrow":
				this.setVisable(false,false,false)
				value.StartDate = '[Tomorrow]' //this.tomorrow
				value.EndDate = '[Tomorrow]' //this.tomorrow
				break
			case "Next Business Day":
				this.setVisable(false,false,false)
				value.StartDate = '[Next Weekday]'//this.nextBusinessDay
				value.EndDate = '[Next Weekday]'//this.nextBusinessDay
				break
			case "Next Week":
				this.setVisable(false,false,false)
				value.StartDate = '[NextWeekStart]'//this.nextWeekStart
				value.EndDate = '[NextWeekEnd]'//this.nextWeekEnd
				break
			case "Last Week":
				this.setVisable(false,false,false)
				value.StartDate = '[LastWeekStart]'//this.lastWeekStart
				value.EndDate = '[LastWeekEnd]'//this.lastWeekEnd
				break
			case "This Week":
				this.setVisable(false,false,false)
				value.StartDate = '[ThisWeekStart]' //this.thisWeekStart
				value.EndDate = '[ThisWeekEnd]' //this.thisWeekEnd
				break
			case "Next Month":
				this.setVisable(false,false,false)
				value.StartDate ='[NextMonthStart]' //this.nextMonthStart
				value.EndDate = '[NextMonthEnd]'//this.nextMonthEnd
				break
			case "Last Month":
				this.setVisable(false,false,false)
				value.StartDate ='[LastMonthStart]' //this.lastMonthStart
				value.EndDate ='[LastMonthEnd]' //this.lastMonthEnd
				break
			case "This Month":
				this.setVisable(false,false,false)
				value.StartDate ='[ThisMonthStart]' //this.thisMonthStart
				value.EndDate ='[ThisMonthEnd]' //this.thisMonthEnd
				break
			case "Next Year":
				this.setVisable(false,false,false)
				value.StartDate ='[NextYearStart]' //this.nextYearStart
				value.EndDate ='[NextYearEnd]' //this.nextYearEnd
				break
			case "Last Year":
				this.setVisable(false,false,false)
				value.StartDate ='[LastYearStart]' //this.lastYearStart
				value.EndDate ='[LastYearEnd]' //this.lastYearEnd
				break
			case "This Year":
				this.setVisable(false,false,false)
				value.StartDate ='[ThisYearStart]' //this.thisYearStart
				value.EndDate ='[ThisYearEnd]' //this.thisYearEnd
				break
			case "Next X Days":
				this.setVisable(true,false,false)
				value.StartDate = '[Tomorrow]' //this.tomorrow
				value.EndDate = '[Next X Days]|1' //this.tomorrow
				this.$elementNumber.val(1)
				break
			case "Last X Days":
				this.setVisable(true,false,false)
				value.StartDate = '[Last X Days]|1' //this.yesterday
				value.EndDate = '[Today]' //this.today
				this.$elementNumber.val(1)
				break
			default:
				this.setVisable(false,false,false)
				break
		}

		value.SelectedItem = dtype;
		if(isUpdate)
		{
			this.value(value)
		}
		return value
	}


	DateRangeBox.prototype.numkeyup = function(viewModel, e)
	{
		var numValue = e.currentTarget.value.replace(/[^\d]/g,'')
		 this.$elementNumber.val(numValue)
	};

	DateRangeBox.prototype.numblur = function(viewModel, e)
	{
		var numValue = e.currentTarget.value.replace(/[^\d]/g,'')
		numValue = numValue==='' ? '1' : numValue
		numValue = numValue < 1 ? '1' : numValue
		numValue = Number(numValue).toString()
		this.$elementNumber.val(numValue)
		var selected = this.$elementSelect.val()
		var rawvalue = this.value()
		if(selected == "Next X Days")
		{
			rawvalue.EndDate = "[Next X Days]|" + numValue.toString();
			
		}
		else if(selected == "Last X Days")
		{
			rawvalue.StartDate = "[Last X Days]|" + numValue.toString();
		}
		rawvalue.DateNum = numValue
		this.value(rawvalue)
	};





	DateRangeBox.prototype.setVisable = function(isNumberVsb,isStartVsb,isEndVsb)
	{
		this.obNumberVsb(isNumberVsb)
		this.obStartVsb(isStartVsb)
		this.obEndVsb(isEndVsb)
	}

	DateRangeBox.prototype.valueSubscribe = function()
	{
		this.value.subscribe(function(newValue)
		{

			if (!this.updating)
			{
				this.onValueChange.notify(newValue);
			}
		}, this);
	};

	DateRangeBox.prototype.afterRender = function()
	{
		var self = this;
		this.initDateTimePicker(this.$elementStartDate,this._dtPickerStart,this.dtBoxHelperStart,"StartDate")
		this.initDateTimePicker(this.$elementEndDate,this._dtPickerEnd,this.dtBoxHelperEnd,"EndDate")
		this.$elementSelect.parent().parent().parent().parent().parent().css('height','60px')

		this.$elementStartDate.parent().parent().css('width','100%')
		this.$elementEndDate.parent().parent().css('width','100%')

		var rawValue = this.value()
		this.SelectedItem(this.value().SelectedItem)
		this.setDateRange(this.value().SelectedItem,false)
		this.value(rawValue)

		this.$elementNumber.val(rawValue.DateNum)

	};


	DateRangeBox.prototype.initDateTimePicker = function(element,dateTimePicker,dateBoxHelper,dateRangeFlag )
	{
		var self = this;
		if (this.attributes && this.attributes["disableWeekend"])
		{ // not working for v2015, need v2016
			element.kendoDatePicker(
				{
					disableDates: ["sa", "su"]
				});
		}
		else
		{
			element.kendoDatePicker(
				{
					max: new Date("12/31/9999"),
					min: new Date("1/1/1900"),
					format: 'MM/dd/yyyy',
					open: function(e)
					{
						self.isOpen = true;
						self._toggleScroll(false);
						self._toggleScroll(true);
						var navigate = self.allBindings().customInput.navigate;
						if (navigate)
						{
							var datePicker = this;
							navigate(datePicker);
							datePicker.dateView.calendar._events.navigate = (this.dateView.calendar._events.navigate || []).concat([function()
							{
								navigate(datePicker);
							}]);
						}
					},
					close: function(e)
					{
						self.isOpen = false;
						self._toggleScroll(false);
						if (self.allBindings().customInput.navigate)
						{
							this.dateView.calendar._events.navigate.pop();
						}
					},
					change: function(e)
					{
						
						this.SelectedItem() == "On" ? dateBoxHelper.dateChange(e,"All") : dateBoxHelper.dateChange(e);
					}.bind(this)
				});
		}
		dateTimePicker = element.data('kendoDatePicker');
		this.value.subscribe(function(value)
		{
			this.bindText(dateTimePicker,dateRangeFlag =="StartDate" ? this.$elementStartDate: this.$elementEndDate , dateRangeFlag =="StartDate" ? value.StartDate : value.EndDate)
		}, this);
		this.onClearRequest.subscribe(function(e)
		{
			dateTimePicker.value(null);
		}.bind(this));
		this.bindText(dateTimePicker,dateRangeFlag =="StartDate" ? this.$elementStartDate: this.$elementEndDate , dateRangeFlag =="StartDate" ? this.value().StartDate : this.value().EndDate)
		element.next("span.k-select").on("click", function(e)
		{
			if (this.isOpen)
			{
				var $input = $(e.currentTarget).prev();
				if ($input.prop("disabled")) return;
				if (!$input.attr("aria-activedescendant")) return;

				var $span = $(e.currentTarget);
				var id = $input.attr("aria-activedescendant").split("_")[0];
				var $calendar = $("#" + id).closest(".k-animation-container");

				if ($(e.currentTarget).closest('.set-calander-right-15px').length > 0)
				{
					$calendar[0].style.left = null;
					$calendar.css('right', '15px');
				}
				else
				{
					var leftPlus = Number($calendar.css('left').split('px')[0]) + Number($input.css('width').split('px')[0]) + (Number($span.css('width').split('px')[0]) / 2) - (Number($calendar.css('width').split('px')[0]) / 2);
					if ((leftPlus + $calendar.width()) <= $(window).width())// VIEW-1296 only change left when in the window
					{
						$calendar.css('left', leftPlus + "px");
					}
				}
			}
		}.bind(this));

		dateBoxHelper = new TF.DateBoxHelper(dateTimePicker, this, dateRangeFlag);
	}

	/*
	 * @param {string} value the object which will be assiged to different input element
	 *
	 * Exchange value of attribute[name] for Validator
	*/
	DateRangeBox.prototype.bindText = function(dateTimePicker,element,value)
	{
		var datetime = moment.utc(value, [this.formatString, moment.ISO_8601]);

		if (!value)
		{

			dateTimePicker.value(null);
		}
		else if (value != '' && !datetime.isValid() || value.indexOf('X Days') > 0)
		{
			//dateTimePicker.value(null);
			element.val(value)
		}
		else
		{
			dateTimePicker.value(datetime.format());
		}
	}
	DateRangeBox.prototype._toggleScroll = function(toggle)
	{
		var method = toggle ? "on" : "off";
		var scrollableParents = this._scrollableParents();
		if (method === "on")
		{
			scrollableParents.map(function(i, item)
			{
				$(item).data("scrollTop", item.scrollTop);
			});
			scrollableParents[method]("scroll.databox", this._resizeProxy.bind(this));
		}
		else
		{
			scrollableParents[method]("scroll.databox");
		}
	};

	DateRangeBox.prototype._scrollableParents = function()
	{
		var that = this;
		return that.$element
			.parentsUntil("body")
			.filter(function(index, element)
			{
				return that._isScrollable(element);
			});
	};

	DateRangeBox.prototype._isScrollable = function(element)
	{
		var overflow = $(element).css("overflow");
		return overflow == "auto" || overflow == "scroll";
	};

	DateRangeBox.prototype._resizeProxy = function(e)
	{
		this._dtPickerStart.dateView.div.data("handler")._hovered = true;
		this._dtPickerEnd.dateView.div.data("handler")._hovered = true;
		var $menu = this._dtPickerStart.dateView.div.parent();
		var $menu = this._dtPickerEnd.dateView.div.parent();
		var scrollTop = $(e.currentTarget).data("scrollTop");
		$menu.css(
			{
				top: $menu.offset().top + scrollTop - e.currentTarget.scrollTop
			});
		$(e.currentTarget).data("scrollTop", e.currentTarget.scrollTop);
	};

	DateRangeBox.prototype.dispose = function()
	{
		this._dtPickerStart.destroy();
		this._dtPickerEnd.destroy();
		ko.removeNode(this.$element[0]);

		namespace.BaseBox.prototype.dispose.call(this);
	};
})();
