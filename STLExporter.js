/**
 * Based on https://github.com/mrdoob/three.js/blob/a72347515fa34e892f7a9bfa66a34fdc0df55954/examples/js/exporters/STLExporter.js
 * Tested on r68, r70 and r79
 * @author jcarletto / https://github.com/jcarletto27
 * @author kjlubick / https://github.com/kjlubick
 * @author kovacsv / http://kovacsv.hu/
 * @author mrdoob / http://mrdoob.com/
 * @author atnartur / http://atnartur.ru
 */

THREE.STLExporter = function () {};

THREE.STLExporter.prototype = {

	constructor: THREE.STLExporter,

	parse: ( function () {

		var vector = new THREE.Vector3();
		var normalMatrixWorld = new THREE.Matrix3();

		return function ( scene ) {

			var output = '';

			output += 'solid exported\n';

			scene.traverse( function ( object ) {
				if ( object instanceof THREE.Mesh ) {

					// if object is hidden - exit
					if(object.visible == false) return; 

					var geometry = object.geometry;
					var matrixWorld = object.matrixWorld;
					var mesh = object;

					if(geometry instanceof THREE.BufferGeometry)
						geometry = new THREE.Geometry().fromBufferGeometry(geometry)

					if ( geometry instanceof THREE.Geometry) {

						var vertices = geometry.vertices;
						var faces = geometry.faces;
						
						normalMatrixWorld.getNormalMatrix( matrixWorld );

						if(typeof faces != 'undefined'){
							for ( var i = 0, l = faces.length; i < l; i ++ ) {
								var face = faces[ i ];

								vector.copy( face.normal ).applyMatrix3( normalMatrixWorld ).normalize();

								output += '\tfacet normal ' + vector.x + ' ' + vector.y + ' ' + vector.z + '\n';
								output += '\t\touter loop\n';

								var indices = [ face.a, face.b, face.c ];

								for ( var j = 0; j < 3; j ++ ) {
									var vertexIndex = indices[ j ];
									if (typeof geometry.skinIndices !== 'undefined' && geometry.skinIndices.length == 0) {
										vector.copy( vertices[ vertexIndex ] ).applyMatrix4( matrixWorld );
										output += '\t\t\tvertex ' + vector.x + ' ' + vector.y + ' ' + vector.z + '\n';
									} else {
										vector.copy( vertices[ vertexIndex ] ); //.applyMatrix4( matrixWorld );
										
										// see https://github.com/mrdoob/three.js/issues/3187
										var boneIndices = [
											geometry.skinIndices[vertexIndex].x,
											geometry.skinIndices[vertexIndex].y,
											geometry.skinIndices[vertexIndex].z,
											geometry.skinIndices[vertexIndex].w
										];
										
										var weights = [
											geometry.skinWeights[vertexIndex].x,
											geometry.skinWeights[vertexIndex].y,
											geometry.skinWeights[vertexIndex].z,
											geometry.skinWeights[vertexIndex].w
										];
										
										var inverses = [
											skeleton.boneInverses[ boneIndices[0] ],
											skeleton.boneInverses[ boneIndices[1] ],
											skeleton.boneInverses[ boneIndices[2] ],
											skeleton.boneInverses[ boneIndices[3] ]
										];

										var skinMatrices = [
											skeleton.bones[ boneIndices[0] ].matrixWorld,
											skeleton.bones[ boneIndices[1] ].matrixWorld,
											skeleton.bones[ boneIndices[2] ].matrixWorld,
											skeleton.bones[ boneIndices[3] ].matrixWorld
										];

										//this checks to see if the mesh has any morphTargets - jc
										if (geometry.morphTargets !== 'undefined') {										
											var morphMatricesX = [];
											var morphMatricesY = [];
											var morphMatricesZ = [];
											var morphMatricesInfluence = [];

											for (var mt = 0; mt < geometry.morphTargets.length; mt++) {
												//collect the needed vertex info - jc
												morphMatricesX[mt] = geometry.morphTargets[mt].vertices[vertexIndex].x;
												morphMatricesY[mt] = geometry.morphTargets[mt].vertices[vertexIndex].y;
												morphMatricesZ[mt] = geometry.morphTargets[mt].vertices[vertexIndex].z;
												morphMatricesInfluence[mt] = morphTargetInfluences[mt];
											}
										}
										
										var finalVector = new THREE.Vector4();

										if (mesh.geometry.morphTargets !== 'undefined') {

											var morphVector = new THREE.Vector4(vector.x, vector.y, vector.z);

											for (var mt = 0; mt < geometry.morphTargets.length; mt++) {
												//not pretty, but it gets the job done - jc
												morphVector.lerp(new THREE.Vector4(morphMatricesX[mt], morphMatricesY[mt], morphMatricesZ[mt], 1), morphMatricesInfluence[mt]);
											}

										}

										for (var k = 0; k < 4; k++) {

											var tempVector = new THREE.Vector4(vector.x, vector.y, vector.z);
											tempVector.multiplyScalar(weights[k]);
											//the inverse takes the vector into local bone space
											tempVector.applyMatrix4(inverses[k])
											//which is then transformed to the appropriate world space
											.applyMatrix4(skinMatrices[k]);
											finalVector.add(tempVector);

										}

										output += '\t\t\tvertex ' + finalVector.x + ' ' + finalVector.y + ' ' + finalVector.z + '\n';
									}
								}
								output += '\t\tendloop\n';
								output += '\tendfacet\n';
							}
						}
					}
				}

			} );

			output += 'endsolid exported\n';

			return output;
		};
	}() )
};

if (typeof module !== "undefined" && module.exports) {
  	module.exports = THREE.STLExporter
} 
else if ((typeof define !== "undefined" && define !== null) && (define.amd !== null)) {
  	define([], function() {
	    return saveAs;
  	});
}
