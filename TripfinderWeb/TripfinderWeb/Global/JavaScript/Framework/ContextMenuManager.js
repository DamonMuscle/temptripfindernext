(function()
{
	var namespace = createNamespace("TF.ContextMenu");
	namespace.ContextMenuManager = ContextMenuManager;

	function ContextMenuManager()
	{
		var $wrapper = $("#contextmenu-wrapper");
		if (TF.isPhoneDevice)
			$wrapper.addClass('is-phone');

		var lastContextMenu = null;


		this.showMenu = function(target, contextMenu, isGridMenu = true)
		{
			this.contextMenu = contextMenu;
			if (!(contextMenu instanceof TF.ContextMenu.BaseContextMenu))
			{
				throw "require a subclass of TF.ContextMenu.BaseContextMenu";
			}
			if (lastContextMenu && !lastContextMenu.disposed)
			{
				lastContextMenu.dispose();
			}
			this.isGridMenu = isGridMenu;
			lastContextMenu = contextMenu;
			contextMenu.render($wrapper, target);
		}

		this.refresh = function()
		{
			this.contextMenu.refresh();
		};

		this.dispose = function()
		{
			if ($wrapper)
				$wrapper.empty();

			if (lastContextMenu)
				lastContextMenu.dispose();
		};
	}
})();
