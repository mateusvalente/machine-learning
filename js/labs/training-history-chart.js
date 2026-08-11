// ============================================================================
// GRÁFICO COMPARTILHADO: ERRO × RESPOSTA
// Usado por todos os laboratórios para comparar, ao longo das épocas:
//   • erro médio do modelo;
//   • taxa de respostas corretas (acurácia entre 0 e 1).
// ============================================================================

class TrainingHistoryChart {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.history = [];
    this.draw();
  }

  reset() {
    this.history = [];
    this.draw();
  }

  add(epoch, error, accuracy) {
    const point = {
      epoch: Number(epoch) || 0,
      error: Math.max(0, Number(error) || 0),
      accuracy: Math.max(0, Math.min(1, Number(accuracy) || 0))
    };
    const last = this.history[this.history.length - 1];
    if (last && last.epoch === point.epoch) this.history[this.history.length - 1] = point;
    else this.history.push(point);

    // Preserva o formato geral sem deixar milhares de pontos tornarem o desenho lento.
    if (this.history.length > 600) {
      this.history = this.history.filter((_, index) => index === 0 || index % 2 === 0);
    }
    this.draw();
  }

  draw() {
    const { ctx, canvas, history } = this;
    const width = canvas.width;
    const height = canvas.height;
    const margin = { left: 68, right: 24, top: 32, bottom: 52 };
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;
    const maxEpoch = Math.max(1, ...history.map(point => point.epoch));
    const rawMax = Math.max(1, ...history.map(point => point.error));
    const maxValue = Math.ceil(rawMax * 10) / 10;
    const mapX = epoch => margin.left + epoch * plotWidth / maxEpoch;
    const mapY = value => margin.top + plotHeight - value * plotHeight / maxValue;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#fbfbff';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = '#e0e4ee';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#667086';
    ctx.font = '14px Manrope';
    for (let index = 0; index <= 4; index++) {
      const value = maxValue * index / 4;
      const y = mapY(value);
      ctx.beginPath();
      ctx.moveTo(margin.left, y);
      ctx.lineTo(width - margin.right, y);
      ctx.stroke();
      ctx.textAlign = 'right';
      ctx.fillText(value.toFixed(value < 1 ? 2 : 1), margin.left - 9, y + 4);
    }

    for (let index = 0; index <= 4; index++) {
      const epoch = Math.round(maxEpoch * index / 4);
      const x = mapX(epoch);
      ctx.textAlign = 'center';
      ctx.fillText(String(epoch), x, height - 19);
    }

    ctx.strokeStyle = '#8992a8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top);
    ctx.lineTo(margin.left, height - margin.bottom);
    ctx.lineTo(width - margin.right, height - margin.bottom);
    ctx.stroke();

    ctx.fillStyle = '#59647b';
    ctx.textAlign = 'center';
    ctx.fillText('ÉPOCAS', margin.left + plotWidth / 2, height - 4);
    ctx.save();
    ctx.translate(14, margin.top + plotHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('VALOR', 0, 0);
    ctx.restore();

    if (!history.length) {
      ctx.fillStyle = '#8a93a7';
      ctx.font = '13px Manrope';
      ctx.textAlign = 'center';
      ctx.fillText('Inicie o treinamento para formar as curvas.', margin.left + plotWidth / 2, margin.top + plotHeight / 2);
      return;
    }

    this.drawSeries('error', '#ed6a78', mapX, mapY);
    this.drawSeries('accuracy', '#19a987', mapX, mapY);
  }

  drawSeries(property, color, mapX, mapY) {
    const { ctx, history } = this;
    ctx.beginPath();
    history.forEach((point, index) => {
      const x = mapX(point.epoch);
      const y = mapY(point[property]);
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();

    const last = history[history.length - 1];
    ctx.beginPath();
    ctx.arc(mapX(last.epoch), mapY(last[property]), 4, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }
}

window.TrainingHistoryChart = TrainingHistoryChart;
