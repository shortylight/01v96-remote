export {};

module.exports = {
    create: function() {
        let listener: ((message: number[]) => void) | undefined;
        const timers: NodeJS.Timeout[] = [];

        const transmitMessage = function(message: number[]) {
            listener?.(message);
        };

        timers.push(setInterval(function() {
            transmitMessage([240,67,16,62,13,1,28,0,0,0,0,Math.round(Math.random()),Math.round(Math.random()*127),247]);
        }, 100));

        [[0, 31], [1, 7], [2, 7], [3, 1]].forEach(function(range) {
            timers.push(setInterval(function() {
                const message = [240,67,16,62,13,33,range[0],0,0];
                for(let i = 0; i <= range[1]; i++) {
                    message.push(Math.round(Math.random() * 32), 0);
                }
                message.push(247);
                transmitMessage(message);
            }, 50));
        });

        return {
            setListener: function(nextListener: (message: number[]) => void) {
                listener = nextListener;
            },
            send: function(_message: number[]) {
                // Simulation does not send data to a physical mixer.
            },
            close: function() {
                timers.forEach(clearInterval);
                listener = undefined;
            }
        };
    }
};
