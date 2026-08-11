// ============================================================================
// VISUALIZAÇÃO COMPARTILHADA DE REDES MULTICAMADAS
// Desenha entradas, camada oculta, saídas, conexões e valores do forward pass.
// ============================================================================

class MLPNetworkView {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
  }

  draw(config) {
    const ctx = this.ctx;
    const canvas = this.canvas;
    const width = canvas.width;
    const height = canvas.height;
    const inputs = config.inputs || [];
    const hidden = config.hidden || [];
    const outputs = config.outputs || [];
    const hasHiddenLayer = hidden.length > 0;
    const inputX = 105;
    const hiddenX = width / 2;
    const outputX = width - 105;
    const inputNodes = this.nodePositions(inputs.length, inputX, height);
    const hiddenNodes = this.nodePositions(hidden.length, hiddenX, height);
    const outputNodes = this.nodePositions(outputs.length, outputX, height);

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#fafbff';
    ctx.fillRect(0, 0, width, height);

    this.drawLayerBand(inputX, 'ENTRADAS', '#eef0ff');
    if (hasHiddenLayer) this.drawLayerBand(hiddenX, 'CAMADA OCULTA', '#e7faf4');
    this.drawLayerBand(outputX, 'SAÍDA', '#fff1e8');

    if (hasHiddenLayer) {
      this.drawConnections(inputNodes, hiddenNodes, config.inputHiddenWeights || []);
      this.drawConnections(hiddenNodes, outputNodes, config.hiddenOutputWeights || []);
    } else {
      this.drawConnections(inputNodes, outputNodes, config.inputOutputWeights || []);
    }

    inputNodes.forEach((position, index) => this.drawNode(position, {
      label: `x${index + 1}`,
      value: inputs[index],
      color: '#4e46e5',
      fill: '#eeedff'
    }));

    hiddenNodes.forEach((position, index) => this.drawNode(position, {
      label: `h${index + 1}`,
      value: hidden[index]?.a,
      color: '#159b80',
      fill: '#e5faf4'
    }));

    outputNodes.forEach((position, index) => this.drawNode(position, {
      label: config.outputLabels?.[index] || (outputs.length === 1 ? 'ŷ' : `y${index + 1}`),
      value: outputs[index],
      color: '#e06c37',
      fill: '#fff0e7'
    }));

    ctx.fillStyle = '#59647b';
    ctx.font = '600 13px Manrope';
    ctx.textAlign = 'center';
    const hiddenMethod = hasHiddenLayer ? `${config.hiddenActivation || 'g'}(u)` : 'sem camada oculta';
    ctx.fillText(hiddenMethod, hasHiddenLayer ? hiddenX : (inputX + outputX) / 2, height - 15);
    ctx.fillText(config.outputActivation || 'saída', outputX, height - 15);

    if (hasHiddenLayer && hidden[0]) {
      const first = hidden[0];
      ctx.fillStyle = '#28314a';
      ctx.textAlign = 'left';
      ctx.font = '600 12px DM Mono';
      ctx.fillText(`h₁: u=${this.format(first.u)} → a=${this.format(first.a)}`, 18, height - 15);
    }
  }

  nodePositions(count, x, height) {
    if (!count) return [];
    // Reserva uma faixa superior exclusiva para os nomes das camadas.
    // O raio do nó é 24 px; começando em 96 px, nenhum círculo invade o título.
    const top = 96;
    const bottom = height - 70;
    if (count === 1) return [[x, (top + bottom) / 2]];
    return Array.from({ length: count }, (_, index) => [x, top + index * (bottom - top) / (count - 1)]);
  }

  drawLayerBand(x, label, color) {
    const ctx = this.ctx;
    ctx.fillStyle = color;
    ctx.fillRect(x - 75, 18, 150, 34);
    ctx.fillStyle = '#4f5970';
    ctx.font = '700 13px Manrope';
    ctx.textAlign = 'center';
    ctx.fillText(label, x, 41);
  }

  drawConnections(fromNodes, toNodes, weights) {
    const ctx = this.ctx;
    toNodes.forEach((target, targetIndex) => {
      fromNodes.forEach((source, sourceIndex) => {
        const weight = Number(weights[targetIndex]?.[sourceIndex] ?? 0);
        ctx.beginPath();
        ctx.moveTo(source[0] + 25, source[1]);
        ctx.lineTo(target[0] - 25, target[1]);
        ctx.strokeStyle = weight >= 0 ? `rgba(78,70,229,${Math.min(.72, .16 + Math.abs(weight) * .32)})` : `rgba(237,106,120,${Math.min(.72, .16 + Math.abs(weight) * .32)})`;
        ctx.lineWidth = Math.min(3.2, 1 + Math.abs(weight));
        ctx.stroke();
      });
    });
  }

  drawNode(position, node) {
    const ctx = this.ctx;
    const [x, y] = position;
    ctx.beginPath();
    ctx.arc(x, y, 24, 0, Math.PI * 2);
    ctx.fillStyle = node.fill;
    ctx.fill();
    ctx.strokeStyle = node.color;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.fillStyle = '#172033';
    ctx.font = '800 14px Manrope';
    ctx.textAlign = 'center';
    ctx.fillText(node.label, x, y - 3);
    ctx.fillStyle = '#59647b';
    ctx.font = '600 12px DM Mono';
    ctx.fillText(this.format(node.value), x, y + 12);
  }

  format(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return '—';
    return number.toFixed(2);
  }
}

window.MLPNetworkView = MLPNetworkView;
