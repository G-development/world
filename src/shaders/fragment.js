// const fragmentShader = `
//     void main(){
//         gl_FragColor = vec4(0.0, 0.8, 1.0, 0.0);
//     }
// `;

const fragmentShader = `
    uniform float c;
    uniform float p;
    varying vec3 vNormal;
    void main() 
    {
        float intensity = pow( c - dot( vNormal, vec3( 0.0, 0.0, 1.0 ) ), p ); 
        gl_FragColor = vec4( 1.0, 1.0, 1.0, 1.0 ) * intensity;
    }
`;

export default fragmentShader;