(function()
{
	createNamespace("TF.Grid").BaseMapPopup = BaseMapPopup;

    function BaseMapPopup(options)
    {
        this.options = options || {};
        this.viewModel = {};
    }

    BaseMapPopup.prototype.buildContent = function(list, index=0)
    {
        const self = this;
        let pagerString = "",
            photoString = "",
            subTitleString = "",
            contentString = "",
            entityCount = list.length,
            dataModel = list[index],
            content = self.generatePopupContent(dataModel),
            contentExtend = "",
            coverFloat = "";

        if (entityCount > 1)
        {
            pagerString = "<div class='head-pager'>\
                                            <div class='page-group'>\
                                                <div class='page-indicator none-select'>" + (index + 1) + " of " + entityCount + "</div>\
                                                <div entityIndex='"+ index + "' class='left-caret page-previous " + (index == 0 ? "useable" : "") + "'></div>\
                                                <div entityIndex='"+ index + "' class='right-caret page-next " + (index == entityCount - 1 ? "useable" : "") + "'></div>\
                                            </div>\
                                        </div>";
        }
        if (content.photo)
        {
            photoString = '<div class="photo back"></div>' +
                '	<div class="cover"></div>' +
                '	<div class="photo none-select no-image">' + content.photo + '</div>' + (entityCount == 1 ? '<div class="head-pager"></div>' : "");
        }

        if (content.contentExtend)
        {
            var tabHeaderItems = [];
            var tabSubContentItems = [];
            content.contentExtend.forEach(function(item, index)
            {
                var cssClass = "";
                if (index == 0)
                {
                    cssClass += " first ";
                }
                else if (index == content.contentExtend.length - 1)
                {
                    cssClass += " last ";
                }
                if (index == self.selectedTabIndex)
                {
                    cssClass += " select ";
                }
                var role = item.name.toLowerCase().replace(/\s/g, "");
                tabHeaderItems.push('<li data-role="' + role + '" class="' + cssClass + '">' + item.name + '</li>');
                tabSubContentItems.push('<div class="sub-content ' + cssClass + '" data-role="' + role + '" >' + item.content + '</div>');
            });
            var tabHeader = '<div class="tab-header none-select">' +
                '				<ul>' + tabHeaderItems.join("") +
                '				</ul>' +
                '			</div>';
            var tabContent = '<div class="tab-content">' + tabSubContentItems.join("") + '</div>';
            contentExtend = '<div class="content-extend">' + tabHeader + tabContent + '</div>';
        }

        if (content.subTitle)
        {
            subTitleString = '<div class=" detail-right">' + content.subTitle + '</div>';
        }

        if (content.subTitleBelow)
        {
            subTitleString = '<div>' + content.subTitleBelow + '</div>';
            coverFloat = 'cover-float ';
        }

        if (content.contentMain || contentExtend)
        {
            contentString = '<div class="content">' + content.contentMain + contentExtend + '</div>';
            // $(this.map.mapView.popup.container).removeClass("no-content");
        }
        // else
        // {
        //     $(this.map.mapView.popup.container).addClass("no-content");
        // }

        var canShowDetailView = this.options.canShowDetailView;
        // if (this.viewModel.parentDocument)
        // {
        //     canShowDetailView = this.viewModel.parentDocument.gridViewModel.obCanShowDetailView();
        // }

        // if (this.viewModel.viewie && this.viewModel.viewie.type === "gpsevent")
        // {
        //     canShowDetailView = false;
        // }

        const mapPopup = {};

        if (mapPopup.disableTitleLink)
        {
            canShowDetailView = false;
        }

        var title = '<div class="detail-left ' + coverFloat + (mapPopup.isOneLineTitle ? 'line-clamp-1 ' : '') + (canShowDetailView ? '' : 'disable ') + ' ellipsis" title="' + content.title + '">' + content.title + '</div>';
        // let mapPopupType = mapPopup.options ? mapPopup.options.type : mapPopup.type
        // if (this.options.enableHyperlink &&
        //     this.options.gridType != mapPopupType &&
        //     content.link != false &&
        //     dataModel.Id)
        // {
        //     title = "<div class='detail-left drill-down-links " + coverFloat + "' data-outname='" + content.title + "' data-outtype='" + this.options.gridType + "' data-type='" + mapPopupType + "' data-entityindex='" + dataModel.Id + "'>" + content.title + "</div>";
        // }
        return `<div class="tfweb-esri-popup-container">
                    <div class="head">
                        ${photoString}
                        ${pagerString}
                        <div class="head-details clearfix">
                            ${title}
                            ${subTitleString}
                        </div>
                    </div>
                    ${contentString}
                </div>`;
    }

    BaseMapPopup.prototype.generatePopupContent = function(data)
	{
        const self = this;
		//return content elements
		if (self.options.isDetailView)
		{
			return {
				title: self.buildDetailViewTitle(data),
				contentMain: self.buildDetailViewContentMain(data)
			};
		}
		else
		{
			return {
				photo: self.buildPhoto(data),
				title: self.buildTitle(data),
				subTitle: self.buildSubTitle(data),
				contentMain: self.buildContentMain(data),
				contentExtend: self.buildContentExtend(data)
			};
		}
	};

    BaseMapPopup.prototype.buildDetailViewTitle = function(data)
	{
		return this.buildTitle(data);
	};

	BaseMapPopup.prototype.buildDetailViewContentMain = function(data)
	{
		return null;
	};

	BaseMapPopup.prototype.buildPhoto = function(data)
	{
		return null;
	};

	BaseMapPopup.prototype.buildTitle = function(data)
	{
		return null;
	};

	BaseMapPopup.prototype.buildSubTitle = function(data)
	{
		return null;
	};

	BaseMapPopup.prototype.buildContentMain = function(data)
	{
		return null;
	};

	BaseMapPopup.prototype.buildContentExtend = function(data)
	{
		return null;
	};
})();