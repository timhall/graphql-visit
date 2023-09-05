export default function visit(typeInfo) {
	return {
		Field(node) {
			console.log(`${node.name.value}: ${typeInfo.getType().name}`);
		},
	};
}
