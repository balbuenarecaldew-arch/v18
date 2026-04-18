function toNonNegativeNumber(value){
  return Math.max(0, parseFloat(value) || 0);
}

function nextNumericId(collection){
  return collection.length ? Math.max(...collection.map(item=>item.id)) + 1 : 1;
}
