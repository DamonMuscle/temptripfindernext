(function()
{
	createNamespace("TF.DetailView").DataPointGroupHelper = DataPointGroupHelper;

	function DataPointGroupHelper(detailView)
	{
		var self = this;
		self.detailView = detailView;
		self.selectBlocks = [];
		self.closeBlocks = [];
	};

	DataPointGroupHelper.prototype.startGroup = function($block)
	{
		var self = this, closeBlocks = [];
		self.bindEvents();
		self.detailView.isGroupMode(true);
		self.detailView.grid.setStatic(true);
		self.detailView.resizeDetailView();
		self.selectBlocks = [$block[0]];
		closeBlocks = self.getCloseDataPoints();
		self.closeBlocks = $.grep(closeBlocks, function(block) { return self.selectBlocks.indexOf(block) < 0 });
		self.setDataPointsGroupStyles();
		self.setGroupBorder();
	};

	DataPointGroupHelper.prototype.saveGroup = function()
	{
		var self = this, entity = self.getDataPointGroupData();

		tf.modalManager.showModal(new TF.DetailView.SaveDataPointGroupNameModalViewModel(entity)).then(function(name)
		{
			if (name !== false)
			{
				entity.Id = 0;
				entity.Name = name;
				tf.promiseAjax.post(pathCombine(tf.api.apiPrefixWithoutDatabase(), "datapointgroups"), {
					data: [entity]
				}).then(function(result)
				{
					self.stopGroup();
					self.detailView.dataPointPanel.refreshData();
				});

				//entity.Id = 0;
				//entity.APIIsNew = true;
				//entity.Name = name;

				//tf.promiseAjax.put(pathCombine(tf.api.apiPrefixWithoutDatabase(), "datapointgroup"), {
				//	data: entity
				//}).then(function(result)
				//{
				//	self.stopGroup();
				//	self.detailView.dataPointPanel.refreshData();
				//});
			}
		});
	};

	DataPointGroupHelper.prototype.stopGroup = function()
	{
		var self = this;
		self.clearDataPointsGroupStyles();
		self.detailView.$element.find(".mock-item.grid-stack-item").remove();
		self.detailView.isGroupMode(false);
		self.detailView.grid.setStatic(false);
		self.selectBlocks.length = 0;
		self.closeBlocks.length = 0;
		self.unbindEvents();
	};

	DataPointGroupHelper.prototype.getDataPointGroupData = function()
	{
		var self = this,
			items = [],
			nodes = Array.from(self.selectBlocks).map(function(block)
			{
				return $(block).data()._gridstack_node;
			}),
			minX = Math.min.apply(null, nodes.map(function(n) { return n.x; })),
			minY = Math.min.apply(null, nodes.map(function(n) { return n.y; }));

		items = $.map(self.selectBlocks, function(el, index)
		{
			var data = $(el).data(),
				node = data["_gridstack_node"],
				obj = $.extend(true, data, {
					id: index,
					x: node.x - minX,
					y: node.y - minY,
					w: node.width,
					h: node.height,
					image: data.filePostData ? data.filePostData.fileData : null,
					uniqueClassName: null
				});

			var udfId = Number(data["UDFId"]);
			if (udfId > 0)
			{
				obj.UDFId = udfId;
				var udf = tf.UDFDefinition.getUDFById(Number(data["UDFId"]));
				obj.UDFGUid = udf && udf.UDFGuid;
			}

			if (data.type === "Map")
			{
				var mapRole = $(el).find(".map").attr("role"),
					detailMap = self.detailView.allMaps[mapRole].map, thematicId, thematicName, isLegendOpen, legendNameChecked, legendDescriptionChecked;
				if (detailMap)
				{
					obj.basemap = detailMap.mapToolkit.getCurrentBasemap();
					thematicId = detailMap.thematicInfo.id;
					thematicName = detailMap.thematicInfo.name;
					isLegendOpen = true;
					legendNameChecked = true;
					legendDescriptionChecked = true;

					if (detailMap.legendStatus)
					{
						isLegendOpen = detailMap.legendStatus.isLegendOpen === undefined ? true : detailMap.legendStatus.isLegendOpen;
						legendNameChecked = detailMap.legendStatus.legendNameChecked === undefined ? true : detailMap.legendStatus.legendNameChecked;
						legendDescriptionChecked = detailMap.legendStatus.legendDescriptionChecked === undefined ? true : detailMap.legendStatus.legendDescriptionChecked;
					}
					obj.thematicId = thematicId;
					obj.thematicName = thematicName;
					obj.isLegendOpen = isLegendOpen;
					obj.legendNameChecked = legendNameChecked;
					obj.legendDescriptionChecked = legendDescriptionChecked;
				}
			}

			if (data.type === "tab")
			{
				var uniqueClassName = tf.helpers.detailViewHelper.getDomUniqueClassName(el),
					tabBlock = self.detailView.getActiveGridStack().dataBlocks.find(function(b)
					{
						return b.uniqueClassName == uniqueClassName;
					});

				if (tabBlock && tabBlock.nestedGridStacks)
				{
					var tabNames = tabBlock.tabStrip.dataSource.data().toJSON(),
						dataSources = tabBlock.nestedGridStacks.map(function(nestedGridStack, tabIndex)
						{
							return {
								items: nestedGridStack.serializeLayout().items,
								Name: tabNames[tabIndex].Name
							};
						});

					$.extend(obj, {
						dataSource: dataSources,
						defaultIndex: tabBlock.tabStrip.element.find(".k-content.k-state-active").index() - 1
					});
				}
			}

			return tf.helpers.detailViewHelper.compressDataBlockDescriptor(obj);
		});

		return {
			Id: 0,
			Name: "",
			DataTypeId: tf.dataTypeHelper.getId(self.detailView.gridType),
			DataPoints: JSON.stringify(items),
			Comments: ""
		};
	};

	DataPointGroupHelper.prototype.unbindEvents = function()
	{
		var self = this;
		if (!self.detailView || !self.detailView.$element) return;
		var items = self.detailView.$element.find(".right-container .grid-stack > .grid-stack-item:visible:not(.mock-item,.tab-strip-stack-item .grid-stack-item)");
		items.off(".group");
	};

	DataPointGroupHelper.prototype.bindEvents = function()
	{
		var self = this;
		if (!self.detailView || !self.detailView.$element) return;
		var items = self.detailView.$element.find(".right-container .grid-stack > .grid-stack-item:visible:not(.mock-item,.tab-strip-stack-item .grid-stack-item)");
		items.on("click.group", self.toggleDataPoint.bind(self));
	};

	DataPointGroupHelper.prototype.toggleDataPoint = function(e)
	{
		var self = this, $item = $(e.target).closest(".grid-stack-item"), index, closeBlocks = [];
		if ($item.length <= 0)
		{
			return;
		}

		if (self.selectBlocks.length <= 1 && $item.hasClass("select-to-group"))
		{
			return;
		}

		index = self.selectBlocks.indexOf($item[0]);
		if (index >= 0)
		{
			self.selectBlocks.splice(index, 1);
			self.deletePartedBlocks($item[0]);
		}
		else
		{
			self.selectBlocks.push($item[0]);
		}
		closeBlocks = self.getCloseDataPoints();
		self.closeBlocks = $.grep(closeBlocks, function(block) { return self.selectBlocks.indexOf(block) < 0 });
		self.setDataPointsGroupStyles();
		self.setGroupBorder();
	};

	DataPointGroupHelper.prototype.deletePartedBlocks = function(blockDom)
	{
		var self = this, closeBlocks = [], shouldDelete = [];
		closeBlocks = self.getCloseDataPoints(blockDom);
		if (closeBlocks.length <= 1)
		{
			return;
		}
		closeBlocks = $.grep(closeBlocks, function(block) { return self.selectBlocks.indexOf(block) >= 0 });

		if (closeBlocks.length <= 0)
		{
			return;
		}
		$.each(self.selectBlocks, function(index, block)
		{
			if (!self.checkIfConnectWithFirstBlock(block))
			{
				shouldDelete.push(block);
			}
		});
		$.each(shouldDelete, function(index, block)
		{
			index = self.selectBlocks.indexOf(block);
			if (index >= 0)
			{
				self.selectBlocks.splice(index, 1);
			}
		});
	};

	DataPointGroupHelper.prototype.checkIfConnectWithFirstBlock = function(blockDom, alreadyChecked)
	{
		var self = this, firstBlock = self.selectBlocks[0], closeBlocks = [];
		closeBlocks = self.getCloseDataPoints(blockDom), result = false;

		alreadyChecked = alreadyChecked || [];
		if (blockDom === firstBlock)
		{
			return true;
		}
		if (closeBlocks.length <= 0)
		{
			return false;
		}

		closeBlocks = $.grep(closeBlocks, function(block) { return self.selectBlocks.indexOf(block) >= 0 && alreadyChecked.indexOf(block) < 0 });
		if (closeBlocks.length <= 0)
		{
			return false;
		}
		if (closeBlocks.indexOf(firstBlock) >= 0)
		{
			return true;
		}
		$.each(closeBlocks, function(index, block)
		{
			alreadyChecked.push(blockDom);
			if (self.checkIfConnectWithFirstBlock(block, alreadyChecked))
			{
				result = true;
				return false;
			}
		});
		return result;
	};

	DataPointGroupHelper.prototype.setGroupBorder = function()
	{
		var self = this, blockData, mockBlocks = [], $block, $container = self.detailView.$element.find(".right-container .grid-stack:not(.grid-stack-nested)"), coincideBorders = [];
		self.detailView.$element.find(".mock-item.grid-stack-item").remove();
		if (self.selectBlocks.length === 0)
		{
			return;
		}
		$.each(self.selectBlocks, function(index, block)
		{
			$block = $(block);
			blockData = $block.data("_gridstack_node");
			for (var i = 0; i < blockData.height; i++)
			{
				for (var j = 0; j < blockData.width; j++)
				{
					mockBlocks.push({
						"data-gs-x": parseInt($block.attr("data-gs-x")) + j,
						"data-gs-y": parseInt($block.attr("data-gs-y")) + i,
						"data-gs-height": 1,
						"data-gs-width": 1,
						class: "mock-item grid-stack-item"
					});
				}
			}
		});

		if (mockBlocks.length === 1)
		{
			$block = $("<div/>", mockBlocks[0]);
			$block.addClass("group-border-top group-border-bottom group-border-left group-border-right");
			$container.append($block);
		}
		else
		{
			for (var i = 0; i < mockBlocks.length; i++)
			{
				for (var j = i + 1; j < mockBlocks.length; j++)
				{
					//top
					if (mockBlocks[i]["data-gs-x"] === mockBlocks[j]["data-gs-x"] && mockBlocks[i]["data-gs-y"] === mockBlocks[j]["data-gs-y"] + 1)
					{
						coincideBorders.push({ x1: mockBlocks[i]["data-gs-x"], x2: mockBlocks[i]["data-gs-x"] + 1, y1: mockBlocks[i]["data-gs-y"], y2: mockBlocks[i]["data-gs-y"] });
					}
					//bottom
					else if (mockBlocks[i]["data-gs-x"] === mockBlocks[j]["data-gs-x"] && mockBlocks[i]["data-gs-y"] + 1 === mockBlocks[j]["data-gs-y"])
					{
						coincideBorders.push({ x1: mockBlocks[i]["data-gs-x"], x2: mockBlocks[i]["data-gs-x"] + 1, y1: mockBlocks[i]["data-gs-y"] + 1, y2: mockBlocks[i]["data-gs-y"] + 1 });
					}
					//left
					else if (mockBlocks[i]["data-gs-y"] === mockBlocks[j]["data-gs-y"] && mockBlocks[i]["data-gs-x"] === mockBlocks[j]["data-gs-x"] + 1)
					{
						coincideBorders.push({ x1: mockBlocks[i]["data-gs-x"], x2: mockBlocks[i]["data-gs-x"], y1: mockBlocks[i]["data-gs-y"], y2: mockBlocks[i]["data-gs-y"] + 1 });
					}
					//right
					else if (mockBlocks[i]["data-gs-y"] === mockBlocks[j]["data-gs-y"] && mockBlocks[i]["data-gs-x"] + 1 === mockBlocks[j]["data-gs-x"])
					{
						coincideBorders.push({ x1: mockBlocks[i]["data-gs-x"] + 1, x2: mockBlocks[i]["data-gs-x"] + 1, y1: mockBlocks[i]["data-gs-y"], y2: mockBlocks[i]["data-gs-y"] + 1 });
					}
				}
			}

			$.each(mockBlocks, function(index, block)
			{
				$block = $("<div/>", block);
				$block.addClass("group-border-top group-border-bottom group-border-left group-border-right");
				$.each(coincideBorders, function(index, coincideBorder)
				{
					//top
					if (coincideBorder.x1 === block["data-gs-x"] && coincideBorder.x2 === block["data-gs-x"] + 1 && coincideBorder.y1 === block["data-gs-y"] && coincideBorder.y2 === block["data-gs-y"])
					{
						$block.removeClass("group-border-top");
					}
					//bottom
					else if (coincideBorder.x1 === block["data-gs-x"] && coincideBorder.x2 === block["data-gs-x"] + 1 && coincideBorder.y1 === block["data-gs-y"] + 1 && coincideBorder.y2 === block["data-gs-y"] + 1)
					{
						$block.removeClass("group-border-bottom");
					}
					//left
					else if (coincideBorder.x1 === block["data-gs-x"] && coincideBorder.x2 === block["data-gs-x"] && coincideBorder.y1 === block["data-gs-y"] && coincideBorder.y2 === block["data-gs-y"] + 1)
					{
						$block.removeClass("group-border-left");
					}
					//right
					else if (coincideBorder.x1 === block["data-gs-x"] + 1 && coincideBorder.x2 === block["data-gs-x"] + 1 && coincideBorder.y1 === block["data-gs-y"] && coincideBorder.y2 === block["data-gs-y"] + 1)
					{
						$block.removeClass("group-border-right");
					}
				});
				$container.append($block);
			});
		}
	};

	DataPointGroupHelper.prototype.setDataPointsGroupStyles = function()
	{
		var self = this;
		self.clearDataPointsGroupStyles();
		$.each(self.closeBlocks, function(index, block)
		{
			$(block).addClass("close-to-group");
		});

		$.each(self.selectBlocks, function(index, block)
		{
			$(block).addClass("select-to-group");
		});
	};

	DataPointGroupHelper.prototype.clearDataPointsGroupStyles = function()
	{
		var self = this, items = self.detailView.$element.find(".right-container .grid-stack > .grid-stack-item:visible:not(.mock-item)");
		items.removeClass("close-to-group").removeClass("select-to-group");
	};

	DataPointGroupHelper.prototype.getCloseDataPoints = function(blockDom)
	{
		var self = this, items = self.detailView.$element.find(".right-container .grid-stack > .grid-stack-item:visible:not(.mock-item,.tab-strip-stack-item .grid-stack-item)"),
			node, closeBlocks = [], block, insertCloseBlocks = function(blockData)
			{
				$.each(items, function(index, item)
				{
					if (closeBlocks.indexOf(item) > 0)
					{
						return true;
					}
					node = $(item).data('_gridstack_node');

					if ((node.y + node.height === blockData.y && (node.x < blockData.x + blockData.width && node.x + node.width > blockData.x))
						|| (node.y === blockData.y + blockData.height && (node.x < blockData.x + blockData.width && node.x + node.width > blockData.x))
						|| (node.x + node.width === blockData.x && (node.y < blockData.y + blockData.height && node.y + node.height > blockData.y))
						|| (node.x === blockData.x + blockData.width && (node.y < blockData.y + blockData.height && node.y + node.height > blockData.y)))
					{
						closeBlocks.push(item);
					}
				});
			};

		if (blockDom)
		{
			insertCloseBlocks($(blockDom).data('_gridstack_node'));
		}
		else
		{
			$.each(self.selectBlocks, function(index, block)
			{
				insertCloseBlocks($(block).data('_gridstack_node'));
			});
		}
		return closeBlocks;
	};

	DataPointGroupHelper.prototype.dispose = function()
	{
		var self = this;
		self.unbindEvents();
	};
})();