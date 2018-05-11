////connect ui items with observableArrays
//ko.bindingHandlers.sortableList = {
//    init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
//        var list = valueAccessor();
//        $(element).sortable({
//            update: function (event, ui) {
//                //retrieve our actual data item
//                var item = ko.dataFor(ui.item[0]);
//                // console.log(bindingContext);
//                // bindingContext.$data.HidePopup(item);
//                //figure out its new position
//                var position = ko.utils.arrayIndexOf(ui.item.parent().children(), ui.item[0]);
//                if (allBindingsAccessor().afterSort
//                    && isFunction(allBindingsAccessor().afterSort)) {
//                    allBindingsAccessor().afterSort.call(viewModel, list, item, position);
//                    if (position >= 0) {
//                        ui.item.remove();
//                    }
//                }
//            }
//        });
//    }
//};