ko.isObservableArray = function(obj)
{
	return (ko.isObservable(obj) && obj.remove);
};