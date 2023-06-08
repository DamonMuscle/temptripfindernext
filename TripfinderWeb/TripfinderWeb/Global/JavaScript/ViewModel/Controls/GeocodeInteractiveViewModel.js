(function()
{
	createNamespace("TF.Control").GeocodeInteractiveViewModel = GeocodeInteractiveViewModel;

	function GeocodeInteractiveViewModel(dataSource, previousCount, gridViewModel, modalViewModel)
	{
		var self = this;
		self.modalViewModel = modalViewModel;
		self.dataSource = dataSource;
		self.obGeoStreet = ko.observable("");
		self.obGeoCity = ko.observable("");
		self.obGeoCounty = ko.observable("");
		self.obGeoZip = ko.observable("");
		self.records = dataSource.map(function(data)
		{
			return $.extend({}, data);
		});
		self.gridViewModel = gridViewModel;
		self.currentRecord = ko.observable();
		self.currentRecord.subscribe(function()
		{
			self.recordChange();
		});
		self.currentRecordIndex = ko.observable(0);
		self.currentRecord(dataSource[self.currentRecordIndex()]);
		self.previousCount = ko.observable(previousCount);
		self.successCount = ko.observable(0);
		self.failCount = ko.observable(0);

		self.emptyResult = {
			match: "",
			notes: "",
			status: "",
			latitude: "",
			longitude: ""
		};
		self.findResult = ko.observable(self.emptyResult);
	}

	GeocodeInteractiveViewModel.prototype.init = function(model, e)
	{
		var self = this;
		this.$element = $(e);
		setTimeout(function()
		{
			self.findAddress();
		}, 100);
	};

	GeocodeInteractiveViewModel.prototype.recordChange = function()
	{
		var self = this;
		if (self.currentRecord())
		{
			this.modalViewModel.title("Geocoding : " + self.currentRecord().Name);

			this.obGeoStreet(self.currentRecord().GeoStreet);
			this.obGeoCity(self.currentRecord().GeoCity);
			this.obGeoCounty(self.currentRecord().GeoCounty);
			this.obGeoZip(self.currentRecord().GeoZip);
		}
	};

	GeocodeInteractiveViewModel.prototype.findAddress = function()
	{
		var self = this;
		if (self.currentRecord())
		{
			this.findResult(this.emptyResult);

			var geocodeFinderModalViewModel = new TF.Modal.Grid.GeocodeFinderModalViewModel(self.gridViewModel ? self.gridViewModel.zipCodes : []);

			var currentRecord = self.currentRecord();

			geocodeFinderModalViewModel.data().findAddress(currentRecord.Street, currentRecord.City, currentRecord.Zip).then(function(data)
			{
				if (data && data.exactMatchRecord && data.candidates && data.candidates.length > 0)
				{
					self.afterAddressFind(data.exactMatchRecord, true);
					self.acceptClick();
				}
				else
				{
					tf.modalManager.showModal(geocodeFinderModalViewModel).then(function(ans)
					{
						self.afterAddressFind(ans);
					});
				}
			});
		} else
		{
			self.skipClick();
		}
	};

	GeocodeInteractiveViewModel.prototype.afterAddressFind = function(address, exactMatch)
	{
		this.isFind = false;
		if (address && address.street)
		{
			this.obGeoStreet(address.street);
			this.obGeoCity(address.city);
			this.obGeoCounty(address.state);
			this.obGeoZip(address.zip);
			this.isFind = true;
		}

		if (address && exactMatch)
		{
			this.findResult($.extend(address, {
				match: "exact match",
				notes: "* Street name matched exactly\n* Address number matched exactly",
				status: "Geocoded",
				latitude: address.YCoord,
				longitude: address.XCoord
			}));
		}
		else if (address && address.isManuallyPin)
		{
			this.obGeoStreet("");
			this.obGeoCity("");
			this.obGeoCounty("");
			this.obGeoZip("");
			this.findResult($.extend(address, {
				match: "Inexact match",
				notes: "* Manually pinned",
				status: "Geocoded",
				latitude: address.YCoord,
				longitude: address.XCoord
			}));
			this.isFind = true;
		}
		else if (address && address.Xcoord)
		{
			this.findResult($.extend(address, {
				match: "Inexact match",
				notes: "* Street name picked from interactive list\n* Address number matched exactly",
				status: "Geocoded",
				latitude: address.YCoord,
				longitude: address.XCoord
			}));
		} else
		{
			this.findResult({
				match: "Unable to match",
				notes: "* Street name not matched",
				status: "Ungeocoded",
				latitude: "",
				longitude: ""
			});
		}
	};

	GeocodeInteractiveViewModel.prototype.acceptClick = function()
	{
		if (!this.isFind)
		{
			this.skipClick();
			return;
		}

		this.applyResult();
		var hasNext = this.nextRecord(true);
		if (hasNext)
		{
			this.findAddress();
		}
	};

	GeocodeInteractiveViewModel.prototype.retryClick = function()
	{
		this.findAddress();
	};

	GeocodeInteractiveViewModel.prototype.skipClick = function()
	{
		var hasNext = this.nextRecord(false);
		if (hasNext)
		{
			this.findAddress();
		}
	};

	GeocodeInteractiveViewModel.prototype.finishClick = function()
	{
		var self = this;
		var promise = Promise.resolve();
		this.applyResult();
		if (this.currentRecordIndex() < this.dataSource.length - 1)
		{
			promise = TF.Grid.GeocodeTool.geocodeAddresses(self.dataSource.slice(self.currentRecordIndex() + 1, self.dataSource.length)).then(function(result)
			{
				self.records = self.records.slice(0, self.currentRecordIndex() + 1).concat(result);
			});
		}
		promise.then(function()
		{
			self.finish();
		});
	};

	GeocodeInteractiveViewModel.prototype.applyResult = function()
	{
		var result = this.findResult();
		if (result && result.Xcoord)
		{
			var record = this.records[this.currentRecordIndex()];
			record.GeoStreet = result.GeoStreet;
			record.GeoCity = result.GeoCity;
			record.GeoZip = result.GeoZip;
			record.GeoCounty = result.GeoCounty;
			record.Xcoord = result.Xcoord;
			record.Ycoord = result.Ycoord;
			record.isManuallyPin = result.isManuallyPin;
		}
	};

	GeocodeInteractiveViewModel.prototype.nextRecord = function(success)
	{
		if (this.currentRecordIndex() < this.dataSource.length - 1)
		{
			if (success)
			{
				this.successCount(this.successCount() + 1);
			} else
			{
				this.failCount(this.failCount() + 1);
			}
			this.currentRecordIndex(this.currentRecordIndex() + 1);
			this.currentRecord(this.dataSource[this.currentRecordIndex()]);
			return true;
		} else
		{
			this.finish();
		}
		return false;
	};

	GeocodeInteractiveViewModel.prototype.finish = function()
	{
		var self = this;
		var geoRecords = self.records.filter(function(item)
		{
			return item.Xcoord != 0 && item.Xcoord != null;
		});
		self.modalViewModel.hide();
		self.modalViewModel.resolve(geoRecords);
	};

})();