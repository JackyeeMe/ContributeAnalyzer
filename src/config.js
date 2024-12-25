const projects = {
    backend_power: {
        id: 1,
        path: '~/work/bacnend-power'
    },
    front_bff: {
        id: 2,
        path: '~/work/front-bff'
    },
}
// maybe front and backend team use different branch name, so we need to define it here
export const defBackBrch = 'main';
export const defFrontBrch = 'prod';

// config your team member here
export const frontGroup = ['person M', 'person N', '...'];
export const backGroup = ['person A', 'person B', 'person C', '...'];

// log output verbose (debug)
export const log_verbose = false;
export default projects