(function()
{
	createNamespace("TF.Document").BaseDocumentViewModel = BaseDocumentViewModel;

	function BaseDocumentViewModel(routeState, typename)
	{
		var self = this;
		self.obtabName = ko.observable(null);
		self.raiseRouteChangeRequest = self.raiseRouteChangeRequest.bind(self);
		self.closeThisDocument = self.closeThisDocument.bind(self);
		self.initialize = self.initialize.bind(self);
		self.needReload = ko.observable(false);//RW-997: used when drag record to tab (only to view form now)
		self.obindex = ko.observable(0);
		self.visible = ko.observable(true);
		self.visible.subscribe(this.visibleChanged.bind(this));
		//rateLimit 0 make sure consecutive change to subscribing observables only trigger obFocusState change one time.
		//rateLimit 500 yield priority to other logic, trying to avoid data racing condition
		self.obFocusState = ko.pureComputed(function()
		{
			return self.visible() && !tf.promiseBootbox.obIsShowing();
		}).extend({ rateLimit: 500 });
		self.routeState = routeState;
		self.typename = ko.observable(typename);
		self.serialNumber = ko.observable("");
		//return tab name
		self.name = ko.pureComputed(function()
		{
			if (self.obtabName && self.obtabName())
			{
				return self.obtabName(); //When not a grid
			}

			var lowerTypeName = (self.typename() || "").toLowerCase();
			switch (lowerTypeName)
			{ //When is a grid
				case "document":
					return "" + tf.applicationTerm.getApplicationTermPluralByName("Document");
				case "fieldtriptemplate":
					return tf.applicationTerm.getApplicationTermSingularByName("Field Trip") + " Templates";
				case "report":
					return tf.applicationTerm.getApplicationTermPluralByName("Report");
				case "scheduledreport":
					return tf.applicationTerm.getApplicationTermPluralByName("Scheduled Report");
				case "reportlibrary":
					return tf.applicationTerm.getApplicationTermPluralByName("Report Library");
				case "district policies":
					return tf.applicationTerm.getApplicationTermSingularByName(tf.dataTypeHelper.getFormalDataTypeName(self.typename()));
				default:
					return tf.applicationTerm.getApplicationTermPluralByName(tf.dataTypeHelper.getFormalDataTypeName(self.typename()))
			}
		});

		self.tabCss = ko.pureComputed(function()
		{
			return " " + self.getTabCss();
		});

		self.addToHash();

		//self is used for refresh sticky
		self.DocumentData = {
			documentType: self.documentType,
			routeState: routeState
		};

		self.obToastMessages = ko.observableArray();
		self.obToastMessages.subscribe(self.obToastMessageSubscribe.bind(self));
		self.closeToastMessages = self.closeToastMessages.bind(self);
		self.toastMessagesTimer = null;
	}

	BaseDocumentViewModel.prototype.visibleChanged = function(newValue)
	{
		var self = this;
		if (self.documentType == TF.Document.DocumentData.DashBoard)
		{//Dashborar is special tab, always exists
			if (newValue)
			{
				self.raiseRouteChangeRequest();
			}
			return;
		}

		if ([TF.Document.DocumentData.Grid, TF.Document.DocumentData.ControlPanelGrid].includes(self.documentType))
		{
			if (newValue && self.gridViewModel && self.gridViewModel.searchGrid)
			{
				setTimeout(function()
				{
					self.gridViewModel && self.gridViewModel.searchGrid.fitContainer();
				}, 50);
			}
		}

		if (newValue)
		{
			self.raiseRouteChangeRequest();
			if (tf.documentManagerViewModel.obHashArray()[self.routeState])
			{
				//tab from hide to visible
				tf.documentManagerViewModel.obHashArray()[self.routeState].visible = true;
			}
			tf.documentManagerViewModel.updateUserPreference(self);

			if (self.needReload())
			{
				self.obDataViewModel().load();
				self.needReload(false);
			}
		}
		else
		{
			if (tf.documentManagerViewModel.obHashArray()[self.routeState].visible)
			{
				//tab from visible to hide
				tf.documentManagerViewModel.obHashArray()[self.routeState].visible = false;
			}
			else
			{//new tab but not visible
				tf.documentManagerViewModel.addUserPreferenceCache(self);
			}
		}
	};

	BaseDocumentViewModel.prototype.getDocumentData = function()
	{
		throw "the concreate class should overwrite this method";
	};

	BaseDocumentViewModel.prototype.addToHash = function()
	{
		//add the page to userpreference to take the sequence first
		tf.documentManagerViewModel.addToHash(this);
	};

	BaseDocumentViewModel.prototype.initialize = function()
	{
	};

	BaseDocumentViewModel.prototype.reLayoutPage = function()
	{
	};

	BaseDocumentViewModel.prototype.canClose = function()
	{
		return Promise.resolve(true);
	};

	BaseDocumentViewModel.prototype.closeThisDocument = function()
	{
		tf.documentManagerViewModel.closeDocument(this);
	};

	BaseDocumentViewModel.prototype.raiseRouteChangeRequest = function()
	{
		clearTimeout(this.routeChangeRequestHandle);
		this.routeChangeRequestHandle = setTimeout(function()
		{
			tf.documentManagerViewModel.requestHashChange(this.routeState, this.getHash());
		}.bind(this), 0);

		// Update tabName
		if ((this._view && this._view.tabName) && (this.obtabName() != this._view.tabName))
		{
			this.obtabName(this._view.tabName);
			tf.documentManagerViewModel.isFlat();
		}
	};

	BaseDocumentViewModel.prototype.hide = function()
	{
		this.visible(false);
	};

	BaseDocumentViewModel.prototype.show = function(surpressRouteChangeRequest)
	{
		this.visible(true);
		if (surpressRouteChangeRequest)
		{
			clearTimeout(this.routeChangeRequestHandle);
		}
		//esri only support edit one graphic in the same time
		PubSub.publish("DocumentManagerViewModel_TabChange", this);
		if (this.onDocumentActive)
		{
			this.onDocumentActive();
		}
	};

	BaseDocumentViewModel.prototype.getHash = function()
	{
		throw "subclass should overide this";
	};

	BaseDocumentViewModel.prototype.getTabCss = function()
	{
		switch (this.documentType)
		{
			case TF.Document.DocumentData.Map://pager no need
				return "tab-map"
			case TF.Document.DocumentData.Grid:
				return "tab-grid"
			case TF.Document.DocumentData.DataEntry:
				return "tab-dataentry"
			case TF.Document.DocumentData.DataView:
				return "tab-dataview"
			case TF.Document.DocumentData.DocumentClassification:
			case TF.Document.DocumentData.UserDefinedField:
			case TF.Document.DocumentData.RequiredField:
			case TF.Document.DocumentData.FieldTripConfigs:
			case TF.Document.DocumentData.ControlPanel:
			case TF.Document.DocumentData.ControlPanelGrid://pager no need
			case TF.Document.DocumentData.Automation:
			case TF.Document.DocumentData.SmtpConfig:
			case TF.Document.DocumentData.DataList:
				return "tab-controlpanelgrid"
			case TF.Document.DocumentData.CustomDashboard://pager no need
			case TF.Document.DocumentData.DashBoard://pager no need
				return "tab-dashboard"
			case TF.Document.DocumentData.UserProfile://pager no need
				return "tab-profile"
			case TF.Document.DocumentData.SearchResults:
				return "tab-searchresults"
			case TF.Document.DocumentData.RoutingMap:
				return "tab-map"
			case TF.Document.DocumentData.ResourceScheduler:
				return "tab-scheduler";
			case TF.Document.DocumentData.ExagoBIReportEditor:
				return "tab-reportEditor";
			default:
				break;
		}
		return "";
	}

	//#region toast
	BaseDocumentViewModel.prototype.obToastMessageSubscribe = function()
	{
		var self = this;
		this.obToastMessages().forEach(function(item)
		{
			if (!item.addTime)
			{
				item.addTime = 0;
				item.obFade = ko.observable(false);
			}
			self.startToastMessagesTimer();
		});
	}

	BaseDocumentViewModel.prototype.startToastMessagesTimer = function()
	{
		var self = this;
		if (this.toastMessagesTimer)
		{
			return;
		}
		this.toastMessagesTimer = setInterval(function()
		{
			if (self.toastMouseEnter)
			{
				return;
			}
			self.obToastMessages().forEach(function(item)
			{
				item.addTime++;
				if (item.addTime > (item.autoCloseSecond || 5) && item.autoClose)
				{
					self.removeToastMessages(item);
				}
			});
		}, 1000);
	}

	BaseDocumentViewModel.prototype.closeToastMessages = function(model, e)
	{
		this.obToastMessages.remove(model);
	};

	BaseDocumentViewModel.prototype.toastMessagesMouseEnter = function(model, e)
	{
		var self = this;
		this.toastMouseEnter = true;
		$('body').on('mousemove.toast', function(e)
		{
			if ($(e.target).closest(".toast-messages").length == 0)
			{
				$('body').off('mousemove.toast');
				self.toastMouseEnter = false;
			}
		})
	};

	BaseDocumentViewModel.prototype.removeAllMessageImediately = function()
	{
		var self = this;
		self.obToastMessages().forEach(function(item)
		{
			self.obToastMessages.remove(item);
		});
	}

	BaseDocumentViewModel.prototype.toastMessagesMouseLeave = function(model, e)
	{
		this.toastMouseEnter = false;
	};

	BaseDocumentViewModel.prototype.removeToastMessages = function(item)
	{
		var self = this;
		item.obFade(true);
		setTimeout(function() { self.obToastMessages.remove(item); }, 1400);
	};
	//#endregion

	BaseDocumentViewModel.prototype.dispose = function()
	{
		this.obFocusState.dispose();
		clearInterval(this.toastMessagesTimer);
	};
})()