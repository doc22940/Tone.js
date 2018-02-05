define(["Tone/core/Tone", "Tone/core/Buffer", "Tone/source/Source", "Tone/core/Gain",
	"Tone/core/AudioNode"], function(Tone){

	/**
	 *  @class Wrapper around the native fire-and-forget OscillatorNode. Adds the
	 *     ability to reschedule the stop method.
	 *  @extends {Tone.AudioNode}
	 *  @param  {AudioBuffer|Tone.Buffer}  buffer   The buffer to play
	 *  @param  {Function}  onload  The callback to invoke when the
	 *                               buffer is done playing.
	 */
	Tone.OscillatorNode = function(){

		var options = Tone.defaults(arguments, ["frequency", "type"], Tone.OscillatorNode);
		Tone.AudioNode.call(this, options);

		/**
		 *  The callback to invoke after the
		 *  buffer source is done playing.
		 *  @type  {Function}
		 */
		this.onended = options.onended;

		/**
		 *  The oscillator start time
		 *  @type  {Number}
		 *  @private
		 */
		this._startTime = -1;

		/**
		 *  The oscillator stop time
		 *  @type  {Number}
		 *  @private
		 */
		this._stopTime = -1;

		/**
		 *  The gain node which envelopes the OscillatorNode
		 *  @type  {Tone.Gain}
		 *  @private
		 */
		this._gainNode = this.output = new Tone.Gain(0);

		/**
		 *  The oscillator
		 *  @type  {OscillatorNode}
		 *  @private
		 */
		this._oscillator = this.context.createOscillator();
		this._oscillator.connect(this._gainNode);
		this.type = options.type;

		/**
		 *  The frequency of the oscillator
		 *  @type {Frequency}
		 *  @signal
		 */
		this.frequency = new Tone.Param(this._oscillator.frequency, Tone.Type.Frequency);
		this.frequency.value = options.frequency;

		/**
		 *  The detune of the oscillator
		 *  @type {Frequency}
		 *  @signal
		 */
		this.detune = new Tone.Param(this._oscillator.detune, Tone.Type.Cents);
		this.detune.value = options.detune;

		/**
		 *  The fadeIn time of the amplitude envelope.
		 *  @type {Time}
		 */
		this.fadeIn = options.fadeIn;

		/**
		 *  The fadeOut time of the amplitude envelope.
		 *  @type {Time}
		 */
		this.fadeOut = options.fadeOut;

		/**
		 *  The value that the buffer ramps to
		 *  @type {Gain}
		 *  @private
		 */
		this._gain = 1;
	};

	Tone.extend(Tone.OscillatorNode, Tone.AudioNode);

	/**
	 *  The defaults
	 *  @const
	 *  @type  {Object}
	 */
	Tone.OscillatorNode.defaults = {
		"frequency" : 440,
		"detune" : 0,
		"type" : "sine",
		"fadeIn" : 0,
		"fadeOut" : 0,
		"curve" : "linear",
		"onended" : Tone.noOp
	};

	/**
	 *  Returns the playback state of the oscillator, either "started" or "stopped".
	 *  @type {Tone.State}
	 *  @readOnly
	 *  @memberOf Tone.OscillatorNode#
	 *  @name state
	 */
	Object.defineProperty(Tone.OscillatorNode.prototype, "state", {
		get : function(){
			var now = this.now();
			if (this._startTime !== -1 && now >= this._startTime && (this._stopTime === -1 || now <= this._stopTime)){
				return Tone.State.Started;
			} else {
				return Tone.State.Stopped;
			}
		}
	});

	/**
     * Start the oscillator node at the given time
     * @param  {Time=} time When to start the oscillator
     * @return {OscillatorNode}      this
     */
	Tone.OscillatorNode.prototype.start = function(time){
		if (this._startTime === -1){
			this._startTime = this.toSeconds(time);
			this._oscillator.start(this._startTime);
			this._gainNode.gain.setValueAtTime(1, this._startTime);
		} else {
			throw new Error("cannot call OscillatorNode.start more than once");
		}
		return this;
	};

	/**
     * Sets an arbitrary custom periodic waveform given a PeriodicWave.
     * @param  {PeriodicWave} periodicWave PeriodicWave should be created with context.createPeriodicWave
     * @return {OscillatorNode} this
     */
	Tone.OscillatorNode.prototype.setPeriodicWave = function(periodicWave){
		this._oscillator.setPeriodicWave(periodicWave);
		return this;
	};

	/**
     * Stop the oscillator node at the given time
     * @param  {Time=} time When to stop the oscillator
     * @return {OscillatorNode}      this
     */
	Tone.OscillatorNode.prototype.stop = function(time){
		this._stopTime = this.toSeconds(time);
		this._gainNode.gain.cancelScheduledValues(0);
		this._gainNode.gain.setValueAtTime(0, this._stopTime);
		this.context.clearTimeout(this._timeout);
		this._timeout = this.context.setTimeout(function(){
			this._oscillator.stop(this._stopTime);
			this.onended();
		}.bind(this), this._stopTime - this.now());
		return this;
	};

	/**
	 * The oscillator type. Either 'sine', 'sawtooth', 'square', or 'triangle'
	 * @memberOf Tone.OscillatorNode#
	 * @type {Time}
	 * @name type
	 */
	Object.defineProperty(Tone.OscillatorNode.prototype, "type", {
		get : function(){
			return this._oscillator.type;
		},
		set : function(type){
			this._oscillator.type = type;
		}
	});

	/**
	 *  Clean up.
	 *  @return  {Tone.OscillatorNode}  this
	 */
	Tone.OscillatorNode.prototype.dispose = function(){
		Tone.AudioNode.prototype.dispose.call(this);
		this.onended = null;
		this._oscillator.disconnect();
		this._oscillator = null;
		this._gainNode.dispose();
		this._gainNode = null;
		this.frequency.dispose();
		this.frequency = null;
		this.detune.dispose();
		this.detune = null;
		return this;
	};

	return Tone.OscillatorNode;
});
