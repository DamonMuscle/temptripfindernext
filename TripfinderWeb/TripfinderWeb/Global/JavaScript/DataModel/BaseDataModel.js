(function()
{
	var namespace = window.createNamespace("TF.DataModel");
	namespace.BaseDataModel = BaseDataModel;


	function BaseDataModel (entity)
	{
		this._modified = ko.observableArray();
		this._entityBackup = null;
		if (entity)
		{
			this._entityBackup = JSON.parse(JSON.stringify(entity));
			this._toDataModel(entity);
		}
		else
		{
			this._createNew();
			this._entityBackup = JSON.parse(JSON.stringify(this.toData()));
		}
		this.equalIgnoreFields = ["APIIsDirty", "APIIsNew", "APIToDelete", "LastUpdated", "LastUpdated", "LastUpdatedId", "LastUpdatedType", "LastUpdatedName", "TotalStopTimeManualChanged"];
	};

	BaseDataModel.DataType = {};

	BaseDataModel.prototype.constructor = BaseDataModel;

	BaseDataModel.DataType.Observable = "observable";

	BaseDataModel.DataType.ObservableArray = "observablearray";

	BaseDataModel.prototype.mapping = [
		{ from: "APIIsDirty", to: "apiIsDirty", default: false, required: true },
		{ from: "APIIsNew", to: "apiIsNew", default: true, required: true },
		{ from: "APIToDelete", to: "apiToDelete", default: false, required: true }
	];

	BaseDataModel.prototype._toDataModel = function(entity)
	{

		if (this._calledToDataModel)
		{
			throw "The _toDataModel should not be called from outside";
		}
		this._calledToDataModel = true;
		var index, index2;
		var value, fromKey, toKey, subDataModelType, fromMapping, afterChange, observable, arr, format, notNull, defaultValue;
		var mapping = this.getMapping();
		if (!mapping || !mapping.length)
		{
			throw "no mapping defined for this DataModel";
		}
		for (index in mapping)
		{
			subDataModelType = mapping[index].subDataModelType;
			fromMapping = mapping[index].fromMapping;
			fromKey = mapping[index].from;
			afterChange = mapping[index].afterChange;
			value = entity[fromKey];
			toKey = mapping[index].to;
			format = mapping[index].format;
			notNull = mapping[index].notNull;
			if (!toKey)
			{
				toKey = fromKey.substring(0, 1).toLowerCase() + fromKey.substring(1, fromKey.length)
			}

			if (notNull && value == null)
			{
				defaultValue = mapping[index].default;
				value = (defaultValue === undefined) ? null : defaultValue;
			}

			if (!fromMapping)
			{
				if (!subDataModelType)
				{
					if (!Array.isArray(value))
					{
						this[toKey] = this.createObservable(toKey, value);
					}
					else
					{
						this[toKey] = this.createObservableArray(toKey, value);
					}
				}
				else
				{
					if (!Array.isArray(value))
					{
						observable = new subDataModelType(value);
						this[toKey] = this.createObservable(toKey, observable);
					}
					else
					{
						arr = [];
						for (index2 in value)
						{
							observable = new subDataModelType(value[index2]);
							arr.push(observable);
						}
						this[toKey] = this.createObservableArray(toKey, arr);
					}
				}
			}
			else
			{
				this[toKey] = this.createObservable(toKey, fromMapping(value));
			}
			if (format && typeof format === "function")
			{
				this[toKey](format(value));
			}
			if (afterChange)
			{
				this[toKey].subscribe(afterChange, this);
			}
		}
	};

	BaseDataModel.prototype._createNew = function()
	{
		var mapping = this.getMapping();
		var fromKey, toKey, afterChange;
		for (index in mapping)
		{
			fromKey = mapping[index].from;
			toKey = mapping[index].to;
			afterChange = mapping[index].afterChange;
			if (!toKey)
			{
				toKey = fromKey.substring(0, 1).toLowerCase() + fromKey.substring(1, fromKey.length);
			}
			var defaultValue = mapping[index].default;
			if ($.isFunction(defaultValue))
			{
				defaultValue = mapping[index].default() || "";
			}
			if (!Array.isArray(defaultValue))
			{
				this[toKey] = this.createObservable(toKey, JSON.parse(JSON.stringify(defaultValue)));
			}
			else
			{
				this[toKey] = this.createObservableArray(toKey, JSON.parse(JSON.stringify(defaultValue)));
			}
			this.markChange(toKey);
			if (afterChange)
			{
				this[toKey].subscribe(afterChange, this);
			}
		}
		this.setNew(true);
		this.apiIsDirty(false);
	};

	BaseDataModel.prototype.clone = function()
	{
		return new this.constructor(JSON.parse(JSON.stringify(this.toData())));
	};

	BaseDataModel.prototype.toData = function(full)
	{
		if (full == undefined)
		{
			full = true;
		}
		var index, index2;
		var value, fromKey, toKey, toMapping, subDataModelType, obj, arr, arr2, toAdd, anyChanged, field;
		var output = {};
		var modified = this._modified();
		var mapping = this.getMapping();
		var convert = function(toAdd)
		{
			fromKey = mapping[index].from;
			toKey = mapping[index].to;
			if (!toKey)
			{
				toKey = fromKey.substring(0, 1).toLowerCase() + fromKey.substring(1, fromKey.length)
			}
			subDataModelType = mapping[index].subDataModelType;
			toMapping = mapping[index].toMapping;
			toAdd = toAdd ? toAdd : (full || modified.indexOf(toKey) != -1);
			if (!subDataModelType)
			{
				if (toAdd)
				{
					if (!toMapping)
					{
						output[fromKey] = this[toKey]();
					}
					else
					{
						output[fromKey] = toMapping(this[toKey]());
					}
				}
			}
			else
			{
				if (!ko.isObservableArray(this[toKey]))
				{
					obj = this[toKey]();
					if (obj && obj.toData)
					{
						obj = obj.toData(full);
					}
					else
					{
						obj = null;
					}
					if ((obj && Object.getOwnPropertyNames(obj).length != 0))
					{
						toAdd = true;
						modified.push(toKey);
					}
					if (toAdd)
					{
						output[fromKey] = obj;
					}
				}
				else
				{
					arr = [];
					arr2 = this[toKey]();
					anyChanged = false;
					for (index2 in arr2)
					{
						obj = arr2[index2].toData(full);
						if (Object.getOwnPropertyNames(obj).length != 0)
						{
							modified.push(toKey);
							anyChanged = true;
							arr.push(arr2[index2].toData(full));
						}
					}
					if (toAdd || anyChanged)
					{
						output[fromKey] = arr;
					}
				}
			}
		}.bind(this);

		for (index in mapping)
		{
			convert();
		}
		var isNew = this.IsNew ? true : false;
		var isDirty = this.IsDirty ? true : (modified.length > 0 ? true : false);
		if (isNew || isDirty)
		{
			for (index in mapping)
			{
				if (mapping[index].required)
				{
					convert(true);
				}
			}
		}
		return output;
	};

	BaseDataModel.prototype.createObservable = function(key, value)
	{
		var observable = new ko.observable(value);
		observable.subscribe(this._changeTracker, [this, key]);
		return observable;
	};

	BaseDataModel.prototype.createObservableArray = function(key, value)
	{
		var observable = new ko.observableArray(value);
		observable.subscribe(this._changeTracker, [this, key]);
		return observable;
	};

	BaseDataModel.prototype._changeTracker = function()
	{
		var modified = this[0]._modified;
		modified.remove(this[1]);
		modified.push(this[1]);
		if (this[1] != 'apiIsDirty' && this[0].hasOwnProperty("apiIsDirty"))
		{
			var tmp = !this[0].equals(this[0].toData(), this[0]._entityBackup);

			this[0].apiIsDirty(tmp);
		}
	};

	BaseDataModel.prototype.markChange = function(fieldName)
	{
		if (fieldName in this)
		{
			this._modified.remove(fieldName);
			this._modified.push(fieldName);
			if (this.hasOwnProperty("apiIsDirty"))
			{
				this.apiIsDirty(true);
			}
		}
	};

	BaseDataModel.prototype.setNew = function(isNew)
	{
		this.APIIsNew = isNew;
	};

	BaseDataModel.prototype.update = function(entity)
	{
		var index, index2, value, fromKey, toKey, subDataModelType, fromMapping, observable, arr;

		this._entityBackup = JSON.parse(JSON.stringify(entity));
		var mapping = this.mapping;
		if (!mapping || !mapping.length)
		{
			throw "no mapping defined for this DataModel";
		}
		for (index in mapping)
		{
			subDataModelType = mapping[index].subDataModelType;
			fromMapping = mapping[index].fromMapping;
			fromKey = mapping[index].from;
			value = entity[fromKey];
			toKey = mapping[index].to;
			if (!toKey)
			{
				toKey = fromKey.substring(0, 1).toLowerCase() + fromKey.substring(1, fromKey.length)
			}
			if (!fromMapping)
			{
				if (!subDataModelType)
				{
					this[toKey](value);
				}
				else
				{
					if (!Array.isArray(this[toKey]()))
					{
						this[toKey]().update(value);
					}
					else
					{
						arr = this[toKey]();
						for (index2 = 0; index2 < arr.length; index2++)
						{
							arr[index2].update(value[index2]);
						}
					}
				}
			}
			else
			{
				this[toKey](fromMapping(value));
			}
		}
		if (this.hasOwnProperty("apiIsNew"))
		{
			this.apiIsNew(false);
		}
		if (this.hasOwnProperty("apiToDelete"))
		{
			this.apiToDelete(false);
		}
		if (this.hasOwnProperty("apiIsDirty"))
		{
			this.apiIsDirty(false);
		}
		this._modified.removeAll();
	};

	/**
	 * Update data model's entityBackup, usually after specifying default values at initialization.
	 * @returns {void} 
	 */
	BaseDataModel.prototype.updateEntityBackup = function()
	{
		var entity = $.extend({}, this.toData());

		this._entityBackup = JSON.parse(JSON.stringify(entity));
		this.apiIsDirty(false);
	};

	BaseDataModel.prototype.getMapping = function()
	{
		var arr = [];
		var proto = this.__proto__;
		var mapping;
		while (proto)
		{
			mapping = proto.mapping;
			if (mapping)
			{
				Array.extend(arr, mapping);
			}
			proto = proto.__proto__;
		}
		return arr;
	};

	BaseDataModel.prototype.revert = function()
	{
		this.update(this._entityBackup);
	};


	BaseDataModel.create = function(type, data)
	{
		if ($.isArray(data))
		{
			return $.map(data, function(n, i) { return new type(n) });
		}
		else
		{
			return new type(data);
		}
	};

	BaseDataModel.prototype.equals = function(entity, backup)
	{
		if (entity === backup) return true;

		if (!(entity instanceof Object) || !(backup instanceof Object)) return false;

		if (entity.constructor !== backup.constructor) return false;
		if ($.isArray(entity) && entity.length != backup.length) return false;
		for (var p in entity)
		{
			if (this.equalIgnoreFields.some(function(item) { return p === item })) continue;

			if (!entity.hasOwnProperty(p)) continue;

			if (!backup.hasOwnProperty(p)) continue;

			if (entity[p] === backup[p])
			{
				continue;
			}

			if (typeof (entity[p]) !== "object")
			{
				if (String(entity[p]) === String(backup[p]))
				{
					continue;
				}
				var entityDate = moment(entity[p]);
				if (kendo.parseDate(String(entity[p])) != null && entityDate.isValid() && entityDate.isSame(moment(backup[p])))
				{
					continue;
				}
			}

			if ((entity[p] === "" && backup[p] === "(   )   -") || ((entity[p] === null && backup[p] === "") || (entity[p] === "" && backup[p] === null)))
			{
				continue;
			}

			if (typeof (entity[p]) !== "object")
			{
				return false;
			}

			if (!this.equals(entity[p], backup[p]))
			{
				return false;
			}

		}

		return true;
	}
})();
