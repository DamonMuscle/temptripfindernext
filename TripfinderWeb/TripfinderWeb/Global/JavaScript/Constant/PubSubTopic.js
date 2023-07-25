var namespace = createNamespace("pb");
pb.DATA_CHANGE = "datachange";
pb.ADD = "add";
pb.EDIT = "edit";
pb.DELETE = "delete";
pb.UI_CHANGE = "uichange";
pb.RESIZE = "resize";
pb.TABS_SORTED = "tabssorted";
pb.REQUIRED_FIELDS_CHANGED = "requiredfieldschanged";
pb.REQUIRED_UDF_FIELDS_CHANGED = "requiredudffieldschanged";

function topicCombine()
{
	var args = Array.prototype.slice.call(arguments);
	if (Enumerable.From(args).Where(function(c) { return c == null || c == undefined }).ToArray().length != 0)
	{
		throw "some arguments are null or undefined";
	}
	var topic = Array.prototype.slice.call(arguments).join(".");
	if (topic != "")
	{
		return topic;
	}
	return null;
}