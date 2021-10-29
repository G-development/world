// const vertexShader = `
//     void main() {
//         gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
//     }
// `;

const vertexShader = `
varying vec2 vN;

      void main() {
      	vec4 p = vec4( position, 1. );

      	vec3 e = normalize( vec3( modelViewMatrix * p ) );
      	vec3 n = normalize( normalMatrix * normal );

      	vec3 r = reflect( e, n );
      	float m = 2. * length( vec3( r.xy, r.z + 1. ) );
      	vN = r.xy / m + .5;

      	gl_Position = projectionMatrix * modelViewMatrix * p;
      }
`;

export default vertexShader;    