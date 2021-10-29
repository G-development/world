// const fragmentShader = `
//     void main(){
//         gl_FragColor = vec4(0.0, 0.8, 1.0, 0.0);
//     }
// `;

const fragmentShader = `
uniform sampler2D tMatCap;

      varying vec2 vN;

      void main() {
      	vec3 base = texture2D( tMatCap, vN ).rgb;
      	gl_FragColor = vec4( base, 1. );
      }
`;

export default fragmentShader;