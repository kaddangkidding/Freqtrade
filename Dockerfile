FROM freqtradeorg/freqtrade:stable

USER root
RUN pip install --no-cache-dir fastapi uvicorn requests ccxt

USER ftuser
WORKDIR /freqtrade

ENTRYPOINT ["freqtrade"]
CMD ["trade", "--config", "user_data/config.json", "--strategy", "OrderFlowRegimeStrategy"]
