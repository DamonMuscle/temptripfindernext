(function()
{
	createNamespace("TF.UserDefinedField").AddIPRangeViewModel = AddIPRangeViewModel;

	function AddIPRangeViewModel(options)
	{
		var self = this;
		self.STR_INVALID_IP_FORMAT = "Invalid IP Format.";
		self.gridType = options.gridType;
		self.isEdit = options.dataEntity != null && !options.dataEntity.isCopy;
		self.isCopy = options.dataEntity != null && options.dataEntity.isCopy;
		self.originalIPRanges = options.currentIPRanges;
		self.obIPRangeList = ko.observableArray([]);
		self.generateIPRangeList();
		self.savedIPRanges = '';
	}

	AddIPRangeViewModel.prototype.init = function(vm, el)
	{
		var self = this;
		self.$element = $(el);
	};

	AddIPRangeViewModel.prototype.generateIPRangeList = function()
	{
		const self = this;
		if (self.originalIPRanges)
		{
			var splitedIPRangeList = self.originalIPRanges.toString().split(",");
			splitedIPRangeList.forEach(ipRange =>
			{
				if (ipRange.includes("-"))
				{
					var ipPair = ipRange.split("-");
					self.obIPRangeList.push({
						leftIPAddress: ko.observable(ipPair[0].trim()),
						rightIPAddress: ko.observable(ipPair[1].trim()),
						hasError: ko.observable(false),
						errorMessage: ko.observable(self.STR_INVALID_IP_FORMAT)
					});
				}
				else
				{
					self.obIPRangeList.push({
						leftIPAddress: ko.observable(ipRange.trim()),
						rightIPAddress: ko.observable(ipRange.trim()),
						hasError: ko.observable(false),
						errorMessage: ko.observable(self.STR_INVALID_IP_FORMAT)
					});
				}
			});
		}
		if (self.obIPRangeList().length === 0)
		{
			self.addIPRangeRowBtnClick();
		}
	};

	AddIPRangeViewModel.prototype.generateIPRangeString = function()
	{
		const self = this;
		let resultStr = "";
		if (self.obIPRangeList())
		{
			self.obIPRangeList().forEach((ipPair) =>
			{
				if (resultStr !== "")
				{
					resultStr += ',';
				}
				if (ipPair.leftIPAddress().toString() === ipPair.rightIPAddress().toString())
				{
					resultStr += ipPair.leftIPAddress().trim();
				}
				else
				{
					resultStr = `${resultStr}${ipPair.leftIPAddress().trim()}-${ipPair.rightIPAddress().trim()}`;
				}
			});
		}
		self.savedIPRanges = resultStr;
	};

	AddIPRangeViewModel.prototype.addIPRangeRowBtnClick = function()
	{
		const self = this;
		self.obIPRangeList.push({
			leftIPAddress: ko.observable(),
			rightIPAddress: ko.observable(),
			hasError: ko.observable(false),
			errorMessage: ko.observable(self.STR_INVALID_IP_FORMAT)
		});
	};

	AddIPRangeViewModel.prototype.deleteIPRangeRowBtnClick = function(model, e)
	{
		const self = this;
		self.obIPRangeList.remove(model);
		e.stopPropagation();
	};

	AddIPRangeViewModel.prototype.ipAddressInputOnBlur = function(model, e)
	{
		const self = this, leftIPAddress = model.leftIPAddress(), rightIPAddress = model.rightIPAddress();
		// check format
		let isRightAddress = $(e.target).attr("name") === "RightIPAddress";
		let address = isRightAddress ? rightIPAddress : leftIPAddress;
		if (address && !self.validIPAddress(address, model))
		{
			return;
		}
		model.hasError(!self.isValidIPRange(model));
	};

	AddIPRangeViewModel.prototype.ipAddressInputOnFocus = function(model, e)
	{
		const self = this;
		if (model.leftIPAddress() && !model.rightIPAddress())
		{
			// check format
			if (!self.validIPAddress(model.leftIPAddress(), model))
			{
				return;
			}
			model.rightIPAddress(model.leftIPAddress());
		}
	};

	AddIPRangeViewModel.prototype.checkIPRangeList = function()
	{
		const self = this;
		let hasAnyError = false;
		if (self.obIPRangeList().length > 0)
		{
			self.obIPRangeList().forEach(ipRange =>
			{
				if (!ipRange.leftIPAddress() && ipRange.rightIPAddress())
				{
					if (!self.validIPAddress(ipRange.rightIPAddress(), ipRange))
					{
						hasAnyError = true;
						return;
					}
					ipRange.leftIPAddress(ipRange.rightIPAddress());
					ipRange.hasError(false);
				}

				if (ipRange.leftIPAddress() && !ipRange.rightIPAddress())
				{
					if (!self.validIPAddress(ipRange.leftIPAddress(), ipRange))
					{
						hasAnyError = true;
						return;
					}
					ipRange.rightIPAddress(ipRange.leftIPAddress());
				}

				if (ipRange.leftIPAddress() && ipRange.rightIPAddress())
				{
					if (!self.validIPAddress(ipRange.rightIPAddress(), ipRange) || 
						!self.validIPAddress(ipRange.leftIPAddress(), ipRange))
					{
						hasAnyError = true;
						return;
					}
					ipRange.hasError(!self.isValidIPRange(ipRange));
				}
				else
				{
					ipRange.hasError(true);
				}

				if(ipRange.hasError())
				{
					hasAnyError = true;
				}
			})
		}
		return hasAnyError;
	};

	AddIPRangeViewModel.prototype.isValidIPRange = function(ipRangeModel)
	{
		const self = this, leftIPAddress = ipRangeModel.leftIPAddress(), rightIPAddress = ipRangeModel.rightIPAddress();
		if (!leftIPAddress || !rightIPAddress)
		{
			return false;
		}

		if (leftIPAddress.includes("\\") !== rightIPAddress.includes("\\"))
		{
			return false;
		}

		if (leftIPAddress.includes(".") !== rightIPAddress.includes("."))
		{
			return false;
		}

		if (leftIPAddress.includes(":") !== rightIPAddress.includes(":"))
		{
			return false;
		}

		if (leftIPAddress.includes("\\") && leftIPAddress.toString() !== rightIPAddress.toString())
		{
			return false;
		}

		if (leftIPAddress.includes(":"))
		{
			return self.isValidIPV6Range(leftIPAddress, rightIPAddress)
		}
		else if (leftIPAddress.includes("."))
		{
			return self.isValidIPV4Range(leftIPAddress, rightIPAddress)
		}

		return false;
	};

	AddIPRangeViewModel.prototype.isValidIPV4Range = function(leftIPAddress, rightIPAddress)
	{
		var self = this;

		if (leftIPAddress.includes("\\"))
		{
			if (leftIPAddress.toString() !== rightIPAddress.toString())
			{
				return false;
			}

			if (!self.isValidIPV4(leftIPAddress, true))
			{
				return false;
			}
		}
		else
		{
			if (!self.isValidIPV4(leftIPAddress) || !self.isValidIPV4(rightIPAddress))
			{
				return false;
			}

			if (self.makeIpNumber(leftIPAddress) > self.makeIpNumber(rightIPAddress))
			{
				return false;
			}
		}

		return true;
	};

	AddIPRangeViewModel.prototype.isValidIPV6Range = function(leftIPAddress, rightIPAddress)
	{
		var self = this;
		leftIPAddress = leftIPAddress.toLowerCase();
		rightIPAddress = rightIPAddress.toLowerCase();

		if (leftIPAddress.includes("\\"))
		{
			if (leftIPAddress.toString() !== rightIPAddress.toString())
			{
				return false;
			}

			if (!self.isValidIPV6(leftIPAddress))
			{
				return false;
			}
		}
		else
		{
			if (!self.isValidIPV6(leftIPAddress) || !self.isValidIPV6(rightIPAddress))
			{
				return false;
			}

			if (self.formatIPV6(leftIPAddress) > self.formatIPV6(rightIPAddress))
			{
				return false;
			}
		}

		return true;
	};

	AddIPRangeViewModel.prototype.validIPAddress = function (ipAddress, ipRange)
	{
		const self = this;

		//IPV4
		if (ipAddress.includes("."))
		{
			if (ipAddress.includes("\\"))
			{
				if(self.isValidIPV4(ipAddress, true))
				{
					return true;
				}
			} else
			{
				if (self.isValidIPV4(ipAddress))
				{
					return true;
				}
			}
		} else if (ipAddress.includes(":")) // IPV6
		{
			if (self.isValidIPV6(ipAddress))
			{
				return true;
			}
		}

		ipRange.hasError(true);
		ipRange.errorMessage(self.STR_INVALID_IP_FORMAT);
		return false;
	};

	AddIPRangeViewModel.prototype.isValidIPV4 = function(ipAddress, isNumerousIPs = false)
	{
		if (isNumerousIPs)
		{
			var splitIP = ipAddress.split('/');
			if (splitIP.length !== 2)
			{
				return false;
			}
			ipAddress = splitIP[0];

			var ipNumberous = parseInt(splitIP[1]);
			if (ipNumberous < 0 || ipNumberous > 32)
			{
				return false;
			}
		}

		if (/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ipAddress))
		{
			return true;
		}

		return false;
	};

	AddIPRangeViewModel.prototype.isValidIPV6 = function(ipAddress)
	{
		if (/((^\s*((([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5]))\s*$)|(^\s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%.+)?\s*$))|^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/(3[0-2]|[1-2][0-9]|[0-9]))$|^s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]d|1dd|[1-9]?d)(.(25[0-5]|2[0-4]d|1dd|[1-9]?d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]d|1dd|[1-9]?d)(.(25[0-5]|2[0-4]d|1dd|[1-9]?d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]d|1dd|[1-9]?d)(.(25[0-5]|2[0-4]d|1dd|[1-9]?d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]d|1dd|[1-9]?d)(.(25[0-5]|2[0-4]d|1dd|[1-9]?d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]d|1dd|[1-9]?d)(.(25[0-5]|2[0-4]d|1dd|[1-9]?d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]d|1dd|[1-9]?d)(.(25[0-5]|2[0-4]d|1dd|[1-9]?d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]d|1dd|[1-9]?d)(.(25[0-5]|2[0-4]d|1dd|[1-9]?d)){3}))|:)))(%.+)?s*(\/(12[0-8]|1[0-1][0-9]|[1-9][0-9]|[0-9]))$/gi.test(ipAddress))
		{
			return true;
		}

		return false;
	};

	AddIPRangeViewModel.prototype.formatIPV6 = function(ipAddress)
	{
		let splited = ipAddress.split(":");
		if (splited.length < 8)
		{
			const index = splited.indexOf("");
			const temp = splited.slice(index + 1, splited.length);
			const zero = [];
			for (let i = 0; i < (8 - splited.length + 1); i++)
			{
				zero.push("0000")
			}

			splited = splited.slice(0, index).concat(zero).concat(temp);
		}

		return splited;
	};

	AddIPRangeViewModel.prototype.makeIpNumber = function(ipAddress)
	{
		return Number(ipAddress.split('.').map((subString) => (`00${subString}`).slice(-3)).join(''));
	};

	AddIPRangeViewModel.prototype.apply = function()
	{
		return Promise.resolve(true);
	};

	AddIPRangeViewModel.prototype.cancel = function()
	{
		return Promise.resolve(false);
	};

	AddIPRangeViewModel.prototype.dispose = function()
	{
		// dispose
	};
})();
